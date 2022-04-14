/* eslint-disable @typescript-eslint/no-explicit-any */
import { Observable } from 'rxjs';
import {
  AnyStateMachine,
  AreAllImplementationsAssumedToBeProvided,
  EventObject,
  InternalMachineOptions,
  InterpreterFrom,
  InterpreterOptions,
  Observer,
  State,
  StateConfig,
  StateFrom,
} from 'xstate';

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

export type MaybeLazy<T> = T | (() => T);

export type NoInfer<T> = [T][T extends any ? 0 : any];

export type Prop<T, K> = K extends keyof T ? T[K] : never;

export type RestParams<TMachine extends AnyStateMachine> =
  AreAllImplementationsAssumedToBeProvided<
    TMachine['__TResolvedTypesMeta']
  > extends false
    ? [
        options: InterpreterOptions &
          UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta'],
            true
          >,
        observerOrListener?:
          | Observer<
              State<
                TMachine['__TContext'],
                TMachine['__TEvent'],
                any,
                TMachine['__TTypestate'],
                TMachine['__TResolvedTypesMeta']
              >
            >
          | ((
              value: State<
                TMachine['__TContext'],
                TMachine['__TEvent'],
                any,
                TMachine['__TTypestate'],
                TMachine['__TResolvedTypesMeta']
              >
            ) => void)
      ]
    : [
        options?: InterpreterOptions &
          UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta']
          >,
        observerOrListener?:
          | Observer<
              State<
                TMachine['__TContext'],
                TMachine['__TEvent'],
                any,
                TMachine['__TTypestate'],
                TMachine['__TResolvedTypesMeta']
              >
            >
          | ((
              value: State<
                TMachine['__TContext'],
                TMachine['__TEvent'],
                any,
                TMachine['__TTypestate'],
                TMachine['__TResolvedTypesMeta']
              >
            ) => void)
      ];

export type UseMachineRestParams<TMachine extends AnyStateMachine> =
  AreAllImplementationsAssumedToBeProvided<
    TMachine['__TResolvedTypesMeta']
  > extends false
    ? [
        options: InterpreterOptions &
          UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta'],
            true
          >
      ]
    : [
        options?: InterpreterOptions &
          UseMachineOptions<TMachine['__TContext'], TMachine['__TEvent']> &
          InternalMachineOptions<
            TMachine['__TContext'],
            TMachine['__TEvent'],
            TMachine['__TResolvedTypesMeta']
          >
      ];

export type UseMachineReturn<
  TMachine extends AnyStateMachine,
  TInterpreter = InterpreterFrom<TMachine>
> = {
  state$: Observable<StateFrom<TMachine>>;
  send: Prop<TInterpreter, 'send'>;
  service: TInterpreter;
  select: <T>(
    selector: (state: StateFrom<TMachine>) => T,
    compare?: (a: T, b: T) => boolean
  ) => Observable<T>;
};
