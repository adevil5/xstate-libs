/* eslint-disable @typescript-eslint/no-unused-vars */
import { BehaviorSubject } from 'rxjs';
import { createMachine, Interpreter } from 'xstate';

import { StateMachineServiceBase } from '../lib/state-machine-service-base';
import {
  fetchMachine,
  persistedFetchState,
} from './machines/fetch/fetch.machine';
import { institutionLookupMachine } from './machines/institution-lookup/institution-lookup.machine';
import { spawningMachine } from './machines/spawning/spawning.machine';
import { XstateTestCleaner } from './utils';

describe('useMachine', () => {
  const xtc: XstateTestCleaner = new XstateTestCleaner();

  afterEach(() => {
    xtc.clean();
  });

  test('should work with StateMachineServiceBase', (done) => {
    const stateMachineServiceBase = new StateMachineServiceBase(fetchMachine, {
      services: { fetchData: () => Promise.resolve('fake data') },
    });
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { state$, send, service } = stateMachineServiceBase;

    state$.subscribe({
      next: (state) => {
        if (state.context.data === 'fake data') {
          done();
        }
      },
      error: (err) => done(err),
    });

    send({ type: 'FETCH' });
  });

  test('should work with the StateMachineServiceBase (rehydrated state config)', (done) => {
    const persistedFetchStateJson = JSON.parse(
      JSON.stringify(persistedFetchState)
    );

    const stateMachineServiceBase = new StateMachineServiceBase(fetchMachine, {
      services: { fetchData: () => Promise.resolve('fake data') },
      state: persistedFetchStateJson,
    });
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { state$ } = stateMachineServiceBase;

    state$.subscribe({
      next: (state) => {
        console.log(
          '🚀 ~ file: state-machine-service-base.spec.ts ~ line 54 ~ test ~ state',
          state
        );
        if (state.context?.data === 'persisted data') {
          done();
        }
      },
      error: (err) => done(err),
    });
  });

  it('should provide the service', () => {
    const stateMachineServiceBase = new StateMachineServiceBase(fetchMachine, {
      services: {
        fetchData: () => Promise.resolve('fake data'),
      },
    });
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { service } = stateMachineServiceBase;

    if (!(service instanceof Interpreter)) {
      throw new Error('service not instance of Interpreter');
    }
  });

  it('should merge machine context with options.context', () => {
    const testMachine = createMachine<{ foo: string; test: boolean }>({
      context: {
        foo: 'bar',
        test: false,
      },
      initial: 'idle',
      states: {
        idle: {},
      },
    });

    const stateMachineServiceBase = new StateMachineServiceBase(testMachine, {
      context: { test: true },
    });
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { service } = stateMachineServiceBase;

    expect(service.state.context).toEqual({
      foo: 'bar',
      test: true,
    });
  });

  it('should not spawn actors until service is started', (done) => {
    const stateMachineServiceBase = new StateMachineServiceBase(
      spawningMachine
    );
    xtc.addStateMachineServiceBase(stateMachineServiceBase);

    const { state$, send } = stateMachineServiceBase;

    state$.subscribe({
      next: (state) => {
        if (state.value === 'success') {
          done();
        }
      },
      error: (err) => done(err),
    });

    send({ type: 'SPAWN_PROMISE' });
  });

  it('actions should not have stale data', (done) => {
    const toggleMachine = createMachine<unknown, { type: 'TOGGLE' }>({
      initial: 'inactive',
      states: {
        inactive: {
          on: { TOGGLE: 'active' },
        },
        active: {
          entry: 'doAction',
        },
      },
    });

    const extSubject = new BehaviorSubject(false);

    const doAction = () => {
      expect(extSubject.value).toBeTruthy();
      done();
    };

    const stateMachineServiceBase = new StateMachineServiceBase(toggleMachine, {
      actions: {
        doAction,
      },
    });
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { send } = stateMachineServiceBase;

    extSubject.next(true);
    send('TOGGLE');
  });

  it('should compile with typed matches (createMachine)', () => {
    interface TestContext {
      count?: number;
      user?: { name: string };
    }

    const machine = createMachine<TestContext>({
      initial: 'loading',
      states: {
        loading: {
          initial: 'one',
          states: {
            one: {},
            two: {},
          },
        },
        loaded: {},
      },
    });

    const stateMachineServiceBase = new StateMachineServiceBase(machine);
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { state$, service } = stateMachineServiceBase;

    state$.subscribe({
      next: (state) => {
        if (state.matches('loaded')) {
          const name = state.context.user?.name;

          // never called - it's okay if the name is undefined
          expect(name).toBeTruthy();
        } else if (state.matches('loading')) {
          // Make sure state isn't "never" - if it is, tests will fail to compile
          expect(state).toBeTruthy();
        }
      },
    });

    service.subscribe((state) => {
      if (state.matches('loaded')) {
        const name = state.context.user?.name;

        // never called - it's okay if the name is undefined
        expect(name).toBeTruthy();
      } else if (state.matches('loading')) {
        // Make sure state isn't "never" - if it is, tests will fail to compile
        expect(state).toBeTruthy();
      }
    });
  });

  it('should capture all actions', (done) => {
    let count = 0;

    const machine = createMachine<unknown, { type: 'EVENT' }>({
      initial: 'active',
      states: {
        active: {
          on: {
            EVENT: {
              actions: () => {
                count++;
              },
            },
          },
        },
      },
    });

    let stateCount = 0;
    const stateMachineServiceBase = new StateMachineServiceBase(machine);
    xtc.addStateMachineServiceBase(stateMachineServiceBase);
    const { state$, send } = stateMachineServiceBase;

    send('EVENT');
    send('EVENT');
    send('EVENT');
    send('EVENT');

    state$.subscribe({
      next: () => {
        stateCount++;
      },
      error: (err) => done(err),
    });

    // Observable should only replay latest:
    expect(stateCount).toEqual(1);
    expect(count).toEqual(4);
    done();
  });

  it('should capture initial actions', (done) => {
    let count = 0;

    const machine = createMachine({
      initial: 'active',
      states: {
        active: {
          entry: () => {
            count++;
          },
        },
      },
    });

    const stateMachineServiceBase = new StateMachineServiceBase(machine);
    xtc.addStateMachineServiceBase(stateMachineServiceBase);

    expect(count).toEqual(1);
    done();
  });

  it('should be extendable', (done) => {
    class TestService extends StateMachineServiceBase<typeof fetchMachine> {
      constructor() {
        super(fetchMachine, {
          services: { fetchData: () => Promise.resolve('fake data') },
        });
      }
    }

    const testService = new TestService();
    xtc.addStateMachineServiceBase(testService);
    const { state$, send } = testService;

    state$.subscribe({
      next: (state) => {
        if (state.context.data === 'fake data') {
          done();
        }
      },
      error: (err) => done(err),
    });

    send({ type: 'FETCH' });
  });

  it('should be extendable (InstitutionSearchService)', (done) => {
    class InstitutionSearchService extends StateMachineServiceBase<
      typeof institutionLookupMachine
    > {
      public institutionNameSearchTerm$;
      public institutionSearchResults$;
      public institutionSearchIsLoading$;

      constructor() {
        super(institutionLookupMachine);
        this.institutionNameSearchTerm$ = this.select(
          (state) => state.context.institutionNameSearchTerm
        );
        this.institutionSearchResults$ = this.select(
          (state) => state.context.institutionLookupResults
        );
        this.institutionSearchIsLoading$ = this.select((state) =>
          state.matches('fetching')
        );
      }
    }

    const institutionSearchService = new InstitutionSearchService();
    xtc.addStateMachineServiceBase(institutionSearchService);
    const { state$, send } = institutionSearchService;

    state$.subscribe({
      next: (state) => {
        if (state.matches('idle')) {
          done();
        }
      },
      error: (err) => done(err),
    });
  });

  // test('initial invoked actor should be immediately available', (done) => {
  //   interface ChildMachineContext {
  //     toggleCount: number;
  //   }
  //   type ChildMachineEvents = { type: 'TOGGLE_ACTIVE' };

  //   const childMachine = createMachine<ChildMachineContext, ChildMachineEvents>(
  //     {
  //       id: 'childMachine',
  //       initial: 'active',
  //       context: {
  //         toggleCount: 0,
  //       },
  //       states: {
  //         active: {
  //           on: {
  //             TOGGLE_ACTIVE: {
  //               target: 'inactive',
  //               actions: 'toggleCountUp',
  //             },
  //           },
  //         },
  //         inactive: {
  //           on: {
  //             TOGGLE_ACTIVE: {
  //               target: 'active',
  //               actions: 'toggleCountUp',
  //             },
  //           },
  //         },
  //       },
  //     }
  //   );

  //   const machine = createMachine({
  //     initial: 'active',
  //     invoke: {
  //       id: 'child',
  //       src: childMachine,
  //     },
  //     states: {
  //       active: {},
  //     },
  //   });

  //   const stateMachineServiceBase = new StateMachineServiceBase(machine);
  //   xtc.addStateMachineServiceBase(stateMachineServiceBase);

  //   const actorRef = stateMachineServiceBase.useActorById('child');
  //   actorRef;

  //   expect(actorRef.getSnapshot()).toEqual('active');

  //   const { state$ } = useActor(actorRef);
  //   xtc.addObservableSubscription(
  //     state$.pipe(take(1)).subscribe({
  //       next: (state) => {
  //         expect(state.value).toEqual('active');
  //         done();
  //       },
  //       error: (err) => done(err),
  //     })
  //   );
  // });
});
