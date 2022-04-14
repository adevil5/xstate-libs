// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  eventsCausingActions: {
    spawnPromise: 'SPAWN_PROMISE';
    updateCount: 'done.invoke.my-promise';
  };
  internalEvents: {
    'done.invoke.my-promise': {
      type: 'done.invoke.my-promise';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates: 'start' | 'success';
  tags: never;
}
