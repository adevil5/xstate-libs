/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AnyStateConfig,
  AnyStateMachine,
  AreAllImplementationsAssumedToBeProvided,
  ContextFrom,
  EventFrom,
  EventObject,
  InternalMachineOptions,
  State,
  StateConfig,
  StateFrom,
} from 'xstate';

import { MaybeLazy } from './types';

export interface UseMachineOptions<TContext, TEvent extends EventObject> {
  /**
   * If provided, will be merged with machine's `context`.
   */
  context?: Partial<TContext>;
  /**
   * The state to rehydrate the machine to. The machine will
   * start at this state instead of its `initialState`.
   */
  state?: StateConfig<TContext, TEvent>;
  /**
   * If provided, attempt to load and continually save the
   * machine state's to local or session storage.
   * ::: warning Persisting spawned actors isn't yet supported in XState. :::
   */
  storageKey?: string;
  /**
   * If provided, will override the default of localStorage.
   */
  storageType?: 'localStorage' | 'sessionStorage';
}

export type InitialStateRestParams<TMachine extends AnyStateMachine> =
  AreAllImplementationsAssumedToBeProvided<
    TMachine['__TResolvedTypesMeta']
  > extends false
    ? [
        options: UseMachineOptions<
          TMachine['__TContext'],
          TMachine['__TEvent']
        > &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta'],
            true
          >
      ]
    : [
        options?: UseMachineOptions<
          TMachine['__TContext'],
          TMachine['__TEvent']
        > &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta']
          >
      ];

export const getRehydratedState = <TMachine extends AnyStateMachine>(
  ...[options = {}]: InitialStateRestParams<TMachine>
) => {
  const {
    state: rehydratedStateConfig,
    storageKey,
    storageType = 'localStorage',
  } = options;

  const storage =
    typeof window !== 'undefined' ? window[storageType] : global[storageType];

  let storageKeyJson: string | null = null;

  if (storageKey) {
    storageKeyJson = storage.getItem(storageKey);
  }

  return rehydratedStateConfig
    ? State.create(rehydratedStateConfig)
    : storageKeyJson
    ? State.create(JSON.parse(storageKeyJson))
    : undefined;
};
