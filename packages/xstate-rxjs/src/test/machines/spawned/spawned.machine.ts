import { assign, createMachine, sendParent } from 'xstate';

export const spawnedMachine = createMachine(
  {
    id: 'spawned',
    tsTypes: {} as import('./spawned.machine.typegen').Typegen0,
    schema: {
      context: { count: 100 } as { count: number },
    },
    entry: ['updateCount', 'sendParentFinish'],
  },
  {
    actions: {
      updateCount: assign({ count: (ctx) => ctx.count + 1 }),
      sendParentFinish: sendParent({ type: 'FINISH' }),
    },
  }
);
