import {
  ActorRefFrom,
  assign,
  createMachine,
  DoneEventObject,
  doneInvoke,
} from 'xstate';

export type FetchMachineActor = ActorRefFrom<typeof fetchMachine>;

interface FetchMachineContext {
  data?: string;
}

type FetchMachineEvent = { type: 'FETCH' } | DoneEventObject;
type FetchMachineServices = {
  fetchData: {
    data: string;
  };
};

export const fetchMachine = createMachine(
  {
    id: 'fetch',
    tsTypes: {} as import("./fetch.machine.typegen").Typegen0,
    schema: {
      context: {} as FetchMachineContext,
      events: {} as FetchMachineEvent,
      services: {} as FetchMachineServices,
    },
    context: {
      data: undefined,
    },
    initial: 'idle',
    states: {
      idle: {
        on: { FETCH: 'loading' },
      },
      loading: {
        invoke: {
          id: 'fetchData',
          src: 'fetchData',
          onDone: {
            cond: 'isDataTruthy',
            target: 'success',
            actions: 'assignData',
          },
        },
      },
      success: {
        type: 'final',
      },
    },
  },
  {
    guards: {
      isDataTruthy: (_, e) => {
        return Boolean(e.data.length);
      },
    },
    actions: {
      assignData: assign({
        data: (_, e) => e.data,
      }),
    },
  }
);

export const persistedFetchState = fetchMachine.transition(
  'loading',
  doneInvoke('fetchData', 'persisted data')
);
