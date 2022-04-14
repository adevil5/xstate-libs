/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorSubject, tap } from 'rxjs';
import { AnyState, createMachine, Interpreter } from 'xstate';

import {
  fetchMachine,
  persistedFetchState,
} from './machines/fetch/fetch.machine';
import { spawningMachine } from './machines/spawning/spawning.machine';
import { XstateTestCleaner } from './utils';
import { useMachine } from '../lib/use-machine';

describe('useMachine', () => {
  const xtc: XstateTestCleaner = new XstateTestCleaner();

  afterEach(() => {
    xtc.clean();
    jest.useRealTimers();
  });

  const fetcher = (
    onFetch: () => Promise<any> = () => Promise.resolve('some data'),
    persistedState?: AnyState
  ) => {
    const { state$, send, service } = useMachine(fetchMachine, {
      services: {
        fetchData: onFetch,
      },
      state: persistedState,
    });

    xtc.addXstateService(service);

    return { state$, send, service };
  };

  test('should work with the useMachine hook', (done) => {
    const { state$, send } = fetcher(() => Promise.resolve('fake data'));

    state$.subscribe((state) => {
      if (state.context.data === 'fake data') {
        done();
      }
    });

    send({ type: 'FETCH' });
  });

  test('should work with the useMachine hook (rehydrated state)', (done) => {
    const { state$, service } = fetcher(
      () => Promise.resolve('fake data'),
      persistedFetchState
    );

    service; //?

    state$.subscribe({
      next: (state) => {
        state; //?
        if (state.context.data === 'persisted data') {
          done();
        }
      },
      error: (err) => done(err),
    });
  });

  test('should work with the useMachine hook (rehydrated state config)', (done) => {
    const persistedFetchStateConfig = JSON.parse(
      JSON.stringify(persistedFetchState)
    );

    const { state$ } = fetcher(
      () => Promise.resolve('fake data'),
      persistedFetchStateConfig
    );

    state$.subscribe({
      next: (state) => {
        if (state.context.data === 'persisted data') {
          done();
        }
      },
      error: (err) => done(err),
    });
  });

  test('should provide the service', () => {
    const { service } = fetcher();
    xtc.addXstateService(service);

    if (!(service instanceof Interpreter)) {
      throw new Error('service not instance of Interpreter');
    }
  });

  test('should merge machine context with options.context', () => {
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

    const { service } = useMachine(testMachine, { context: { test: true } });
    xtc.addXstateService(service);

    expect(service.state.context).toEqual({
      foo: 'bar',
      test: true,
    });
  });

  test('should not spawn actors until service is started', (done) => {
    const { state$, send, service } = useMachine(spawningMachine);
    xtc.addXstateService(service);

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

  test('actions should not have stale data', (done) => {
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

    const { send, service } = useMachine(toggleMachine, {
      actions: {
        doAction,
      },
    });
    xtc.addXstateService(service);

    extSubject.next(true);
    send('TOGGLE');
  });

  test('should compile with typed matches (createMachine)', () => {
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

    const { state$, service } = useMachine(machine);
    xtc.addXstateService(service);

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

  test('should capture all actions', (done) => {
    let count = 0;

    const machine = createMachine<unknown, { type: 'EVENT' }>(
      {
        initial: 'active',
        states: {
          active: {
            on: {
              EVENT: {
                actions: 'incrementCount',
              },
            },
          },
        },
      },
      {
        actions: {
          incrementCount: () => {
            count++;
          },
        },
      }
    );

    let stateCount = 0;
    const { state$, send, service } = useMachine(machine);
    xtc.addXstateService(service);

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

  test('should capture initial actions', (done) => {
    let count = 0;

    const machine = createMachine(
      {
        initial: 'active',
        states: {
          active: {
            entry: 'incrementCount',
          },
        },
      },
      {
        actions: {
          incrementCount: () => {
            count++;
          },
        },
      }
    );

    const { service } = useMachine(machine);
    xtc.addXstateService(service);

    expect(count).toEqual(1);
    done();
  });

  test('should work with the select function', (done) => {
    const { service, send, select } = useMachine(fetchMachine, {
      services: { fetchData: () => Promise.resolve('fake data') },
    });
    xtc.addXstateService(service);

    const data$ = select((state) => state.context.data);
    data$.subscribe({
      next: (data) => {
        if (data === 'fake data') {
          done();
        }
      },
      error: (err) => done(err),
    });

    send({ type: 'FETCH' });
  });
});
