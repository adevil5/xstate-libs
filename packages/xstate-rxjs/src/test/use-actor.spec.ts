/* eslint-disable @typescript-eslint/no-unused-vars */
import { take } from 'rxjs/operators';
import { ActorRefFrom, assign, createMachine, sendParent, spawn } from 'xstate';

import { useActor } from '../lib/use-actor';
import { useMachine as useMachine } from '../lib/use-machine';
import { XstateTestCleaner } from './utils';

describe('useActor', () => {
  const xtc: XstateTestCleaner = new XstateTestCleaner();

  afterEach(() => {
    xtc.clean();
  });

  test('initial invoked actor should be immediately available', (done) => {
    const childMachine = createMachine({
      id: 'childMachine',
      initial: 'active',
      states: {
        active: {},
      },
    });
    const machine = createMachine(
      {
        initial: 'active',
        invoke: {
          id: 'child',
          src: 'childMachine',
        },
        states: {
          active: {},
        },
      },
      {
        services: {
          childMachine,
        },
      }
    );

    const { service } = useMachine(machine);
    xtc.addXstateService(service);

    const actorRef = service.state.children.child as ActorRefFrom<
      typeof childMachine
    >;
    expect(actorRef.getSnapshot()?.value).toEqual('active');

    const { current$ } = useActor(actorRef);

    current$.pipe(take(1)).subscribe({
      next: (state) => {
        expect(state.value).toEqual('active');
        done();
      },
      error: (err) => done(err),
    });
  });

  test('invoked actor should be able to receive (deferred) events that it replays when active', (done) => {
    const childMachine = createMachine({
      id: 'childMachine',
      initial: 'active',
      states: {
        active: {
          on: {
            FINISH: { actions: sendParent('FINISH') },
          },
        },
      },
    });
    const machine = createMachine({
      initial: 'active',
      invoke: {
        id: 'child',
        src: childMachine,
      },
      states: {
        active: {
          on: { FINISH: 'success' },
        },
        success: {},
      },
    });

    const { state$: parentState$, service: parentService } =
      useMachine(machine);
    xtc.addXstateService(parentService);

    parentState$.subscribe({
      next: (state) => {
        if (state.matches('success')) {
          done();
        }
      },
      error: (err) => done(err),
    });

    const actorRef = parentService.state.children.child as ActorRefFrom<
      typeof childMachine
    >;
    expect(actorRef.getSnapshot()?.value).toEqual('active');

    const { current$: childState$, send: childSend } = useActor(actorRef);

    childState$.pipe(take(1)).subscribe((state) => {
      expect(state.value).toEqual('active');
      childSend({ type: 'FINISH' });
    });
  });

  test('initial spawned actor should be immediately available', (done) => {
    const childMachine = createMachine({
      id: 'childMachine',
      initial: 'active',
      states: {
        active: {},
      },
    });

    interface Ctx {
      actorRef?: ActorRefFrom<typeof childMachine>;
    }

    const machine = createMachine<Ctx>(
      {
        initial: 'active',
        context: {
          actorRef: undefined,
        },
        states: {
          active: {
            entry: 'spawnChild',
          },
        },
      },
      {
        actions: {
          spawnChild: assign({
            actorRef: (context, event) => spawn(childMachine),
          }),
        },
      }
    );

    const { state$ } = useMachine(machine);

    state$.subscribe((state) => {
      state.context.actorRef;
      const { actorRef: childActorRef } = state.context;

      if (childActorRef === undefined) {
        done(new Error('childActorRef is undefined'));
        return;
      }

      expect(childActorRef.getSnapshot()?.value).toEqual('active');
      done();
    });
  });

  // test('spawned actor should be able to receive (deferred) events that it replays when active', (done) => {
  //   const childMachine = createMachine({
  //     id: 'childMachine',
  //     initial: 'active',
  //     states: {
  //       active: {
  //         on: {
  //           FINISH: { actions: sendParent('FINISH') },
  //         },
  //       },
  //     },
  //   });
  //   const machine = createMachine<{
  //     actorRef?: ActorRefFrom<typeof childMachine>;
  //   }>({
  //     initial: 'active',
  //     context: {
  //       actorRef: undefined,
  //     },
  //     states: {
  //       active: {
  //         entry: assign({
  //           actorRef: () => spawn(childMachine),
  //         }),
  //         on: { FINISH: 'success' },
  //       },
  //       success: {},
  //     },
  //   });

  //   const { state$: parentState$, service: parentService } =
  //     useMachine(machine);
  //   xtc.addXstateService(parentService);

  //   parentState$.subscribe({
  //     next: (parentState) => {
  //       if (parentState.matches('success')) {
  //         done();
  //       }
  //       const actorRef = parentState.context.actorRef;
  //       if (actorRef) {
  //         expect(actorRef?.getSnapshot()?.value).toEqual('active');

  //         const { current$: childState$, send: childSend } = useActor(actorRef);

  //         if (actorRef === undefined) {
  //           done(new Error('actorRef is undefined'));
  //           return;
  //         }

  //         childState$.subscribe((childState) => {
  //           childState; /*? */
  //           expect(childState.value).toEqual('active');
  //         });

  //         childSend({ type: 'FINISH' });
  //       }
  //     },
  //     error: (err) => done(err),
  //   });
  // });

  // TODO: The visual nature of this test makes it better as an angular test.
  // And i'll be splitting this lib into rxjs and angular (a super set of rxjs)
  // but maybe jsdom can do some of these html/js only tests.

  // test('actor should provide snapshot value immediately', () => {
  //   const simpleActor = toActorRef({
  //     send: () => {
  //       /* ... */
  //     },
  //     latestValue: 42,
  //     subscribe: () => {
  //       return {
  //         unsubscribe: () => {
  //           /* ... */
  //         },
  //       };
  //     },
  //   }) as ActorRef<any, number> & {
  //     latestValue: number;
  //   };

  //   const { state$ } = useActor(simpleActor, (a) => a.latestValue);
  //   const Test = () => {
  //     return <div data-testid="state">{state}</div>;
  //   };

  //   const { getByTestId } = render(<Test />);

  //   const div = getByTestId('state');

  //   expect(div.textContent).toEqual('42');
  // });

  // TODO
  // test('should provide value from `actor.getSnapshot()`', () => {
  //   const simpleActor = toActorRef({
  //     id: 'test',
  //     send: () => {
  //       /* ... */
  //     },
  //     getSnapshot: () => 42,
  //     subscribe: () => {
  //       return {
  //         unsubscribe: () => {
  //           /* ... */
  //         }
  //       };
  //     }
  //   });

  //   const Test = () => {
  //     const [state] = useActor(simpleActor);

  //     return <div data-testid="state">{state}</div>;
  //   };

  //   const { getByTestId } = render(<Test />);

  //   const div = getByTestId('state');

  //   expect(div.textContent).toEqual('42');
  // });

  // TODO
  // it('should update snapshot value when actor changes', () => {
  //   const createSimpleActor = (value: number) =>
  //     toActorRef({
  //       send: () => {
  //         /* ... */
  //       },
  //       latestValue: value,
  //       subscribe: () => {
  //         return {
  //           unsubscribe: () => {
  //             /* ... */
  //           }
  //         };
  //       }
  //     }) as ActorRef<any> & { latestValue: number };

  //   const Test = () => {
  //     const [actor, setActor] = useState(createSimpleActor(42));
  //     const [state] = useActor(actor, (a) => a.latestValue);

  //     return (
  //       <>
  //         <div data-testid="state">{state}</div>
  //         <button
  //           data-testid="button"
  //           onClick={() => setActor(createSimpleActor(100))}
  //         ></button>
  //       </>
  //     );
  //   };

  //   const { getByTestId } = render(<Test />);

  //   const div = getByTestId('state');
  //   const button = getByTestId('button');

  //   expect(div.textContent).toEqual('42');
  //   fireEvent.click(button);
  //   expect(div.textContent).toEqual('100');
  // });

  // TODO
  // it('send() should be stable', (done) => {
  //   jest.useFakeTimers();
  //   const fakeSubscribe = () => {
  //     return {
  //       unsubscribe: () => {
  //         /* ... */
  //       }
  //     };
  //   };
  //   const noop = () => {
  //     /* ... */
  //   };
  //   const firstActor = toActorRef({
  //     send: noop,
  //     subscribe: fakeSubscribe
  //   });
  //   const lastActor = toActorRef({
  //     send: () => {
  //       done();
  //     },
  //     subscribe: fakeSubscribe
  //   });

  //   const Test = () => {
  //     const [actor, setActor] = useState(firstActor);
  //     const [, send] = useActor(actor);

  //     React.useEffect(() => {
  //       setTimeout(() => {
  //         // The `send` here is closed-in
  //         send({ type: 'anything' });
  //       }, 10);
  //     }, []); // Intentionally omit `send` from dependency array

  //     return (
  //       <>
  //         <button
  //           data-testid="button"
  //           onClick={() => setActor(lastActor)}
  //         ></button>
  //       </>
  //     );
  //   };

  //   const { getByTestId } = render(<Test />);

  //   // At this point, `send` refers to the first (noop) actor

  //   const button = getByTestId('button');
  //   fireEvent.click(button);

  //   // At this point, `send` refers to the last actor

  //   jest.advanceTimersByTime(20);

  //   // The effect will call the closed-in `send`, which originally
  //   // was the reference to the first actor. Now that `send` is stable,
  //   // it will always refer to the latest actor.
  // });

  // TODO
  // it('should also work with services', () => {
  //   const counterMachine = createMachine<
  //     { count: number },
  //     { type: 'INC' } | { type: 'SOMETHING' }
  //   >(
  //     {
  //       id: 'counter',
  //       initial: 'active',
  //       context: { count: 0 },
  //       states: {
  //         active: {
  //           on: {
  //             INC: { actions: assign({ count: (ctx) => ctx.count + 1 }) },
  //             SOMETHING: { actions: 'doSomething' }
  //           }
  //         }
  //       }
  //     },
  //     {
  //       actions: {
  //         doSomething: () => {
  //           /* do nothing */
  //         }
  //       }
  //     }
  //   );
  //   const counterService = interpret(counterMachine).start();

  //   const Counter = () => {
  //     const [state, send] = useActor(counterService);

  //     return (
  //       <div
  //         data-testid="count"
  //         onClick={() => {
  //           send('INC');
  //           // @ts-expect-error
  //           send('FAKE');
  //         }}
  //       >
  //         {state.context.count}
  //       </div>
  //     );
  //   };

  //   const { getAllByTestId } = render(
  //     <>
  //       <Counter />
  //       <Counter />
  //     </>
  //   );

  //   const countEls = getAllByTestId('count');

  //   expect(countEls.length).toBe(2);

  //   countEls.forEach((countEl) => {
  //     expect(countEl.textContent).toBe('0');
  //   });

  //   act(() => {
  //     counterService.send({ type: 'INC' });
  //   });

  //   countEls.forEach((countEl) => {
  //     expect(countEl.textContent).toBe('1');
  //   });
  // });

  // TODO
  // it('should work with initially deferred actors spawned in lazy context', () => {
  //   const childMachine = createMachine({
  //     initial: 'one',
  //     states: {
  //       one: {
  //         on: { NEXT: 'two' }
  //       },
  //       two: {}
  //     }
  //   });

  //   const machine = createMachine<{ ref: ActorRef<any> }>({
  //     context: () => ({
  //       ref: spawn(childMachine)
  //     }),
  //     initial: 'waiting',
  //     states: {
  //       waiting: {
  //         on: { TEST: 'success' }
  //       },
  //       success: {
  //         type: 'final'
  //       }
  //     }
  //   });

  //   const App = () => {
  //     const [state] = useMachine(machine);
  //     const [childState, childSend] = useActor(state.context.ref);

  //     return (
  //       <>
  //         <div data-testid="child-state">{childState.value}</div>
  //         <button
  //           data-testid="child-send"
  //           onClick={() => childSend('NEXT')}
  //         ></button>
  //       </>
  //     );
  //   };

  //   const { getByTestId } = render(<App />);

  //   const elState = getByTestId('child-state');
  //   const elSend = getByTestId('child-send');

  //   expect(elState.textContent).toEqual('one');
  //   fireEvent.click(elSend);

  //   expect(elState.textContent).toEqual('two');
  // });
});
