/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, shareReplay } from 'rxjs/operators';
import {
  AnyState,
  AnyStateMachine,
  InterpreterStatus,
  StateFrom,
} from 'xstate';

import { useInterpret } from '..';
import { getRehydratedState } from './get-initial-state';
import { MaybeLazy, UseMachineRestParams, UseMachineReturn } from './types';
import { toObserver } from './use-interpret';
import { useSelector } from './use-selector';

export const useMachine = <TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  ...[options = {}]: UseMachineRestParams<TMachine>
): UseMachineReturn<TMachine> => {
  const machine = typeof getMachine === 'function' ? getMachine() : getMachine;

  const rehydratedState = getRehydratedState<TMachine>(options);
  const service = useInterpret(machine, options);

  const stateSubject = new BehaviorSubject(
    rehydratedState ?? service.machine.initialState
  );

  service.subscribe(
    toObserver<AnyState>(
      (nextState) => {
        if (nextState.changed) {
          stateSubject.next(nextState as StateFrom<TMachine>);
        }
      },
      (err) => {
        stateSubject.error(err);
      }
    )
  );

  const state$ = stateSubject.asObservable().pipe(
    distinctUntilChanged((prevState, nextState) => {
      if (service.status === InterpreterStatus.NotStarted) {
        return true;
      }

      // Only change the current state if:
      // - the incoming state is the "live" initial state (since it might have new actors)
      // - OR the incoming state actually changed.
      //
      // The "live" initial state will have .changed === undefined.
      const initialStateChanged =
        nextState.changed === undefined &&
        (Object.keys(nextState.children).length > 0 ||
          typeof prevState.changed === 'boolean');

      return !(nextState.changed || initialStateChanged);
    }),
    shareReplay(1)
  );

  const defaultCompare = (a: any, b: any) => a === b;
  const select = <T>(
    selector: (emitted: StateFrom<TMachine>) => T,
    compare: (a: T, b: T) => boolean = defaultCompare
  ) => useSelector(service, selector, compare);

  return { state$, send: service.send, service, select } as any;
};
