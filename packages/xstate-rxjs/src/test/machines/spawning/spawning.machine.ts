/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActorRef, assign, createMachine, doneInvoke, spawn } from 'xstate';

interface SpawningMachineContext {
  count: number;
  ref?: ActorRef<any, any>;
}

type SpawningMachineEvent =
  | { type: 'SPAWN_PROMISE' }
  | { type: 'done.invoke.my-promise'; data: number };

export const spawningMachine = createMachine(
  {
    id: 'spawn',
    tsTypes: {} as import('./spawning.machine.typegen').Typegen0,
    schema: {
      context: {} as SpawningMachineContext,
      events: {} as SpawningMachineEvent,
    },
    initial: 'start',
    context: {
      count: 42,
      ref: undefined,
    },
    states: {
      start: {
        on: {
          SPAWN_PROMISE: {
            actions: 'spawnPromise',
          },
          'done.invoke.my-promise': {
            target: 'success',
            actions: 'updateCount',
          },
        },
      },
      success: {
        type: 'final',
      },
    },
  },
  {
    actions: {
      updateCount: assign({
        count: (context, event) => context.count + event.data,
      }),
      spawnPromise: assign({
        ref: (context, event) => spawn(Promise.resolve(10), 'my-promise'),
      }),
    },
  }
);
