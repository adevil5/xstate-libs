// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    assignData: 'done.invoke.fetchData';
  };
  internalEvents: {
    'done.invoke.fetchData': {
      type: 'done.invoke.fetchData';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'xstate.init': { type: 'xstate.init' };
    'error.platform.fetchData': {
      type: 'error.platform.fetchData';
      data: unknown;
    };
  };
  invokeSrcNameMap: {
    fetchData: 'done.invoke.fetchData';
  };
  missingImplementations: {
    actions: never;
    services: 'fetchData';
    guards: never;
    delays: never;
  };
  eventsCausingServices: {
    fetchData: 'FETCH';
  };
  eventsCausingGuards: {
    isDataTruthy: 'done.invoke.fetchData';
  };
  eventsCausingDelays: {};
  matchesStates: 'idle' | 'loading' | 'success';
  tags: never;
}
