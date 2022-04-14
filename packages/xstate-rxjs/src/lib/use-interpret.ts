/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyStateMachine, interpret, InterpreterFrom, Observer } from 'xstate';

import { getRehydratedState } from './get-initial-state';
import { MaybeLazy, RestParams } from './types';

// copied from core/src/utils.ts
// it avoids a breaking change between this package and XState which is its peer dep
export function toObserver<T>(
  nextHandler: Observer<T> | ((value: T) => void),
  errorHandler?: (error: any) => void,
  completionHandler?: () => void
): Observer<T> {
  if (typeof nextHandler === 'object') {
    return nextHandler;
  }

  const noop = () => void 0;

  return {
    next: nextHandler,
    error: errorHandler || noop,
    complete: completionHandler || noop,
  };
}

export function useInterpret<TMachine extends AnyStateMachine>(
  getMachine: MaybeLazy<TMachine>,
  ...[options = {}, observerOrListener]: RestParams<TMachine>
): InterpreterFrom<TMachine> {
  const machine = typeof getMachine === 'function' ? getMachine() : getMachine;

  const {
    context,
    guards,
    actions,
    services,
    delays,
    storageKey,
    storageType = 'localStorage',
    ...interpreterOptions
  } = options;

  // it's not defined in `TypegenMachineOptions` so we can't just unpack this property here freely
  const { activities } = options as any;

  const machineConfig = {
    context,
    guards,
    actions,
    activities,
    services,
    delays,
  };

  const machineWithConfig = machine.withConfig(machineConfig as any, () => ({
    ...machine.context,
    ...context,
  }));

  const storage =
    typeof window !== 'undefined' ? window[storageType] : global[storageType];

  const service = interpret(machineWithConfig as any, {
    deferEvents: true,
    ...interpreterOptions,
  });

  if (storageKey) {
    service.subscribe((state) => {
      storage.setItem(storageKey, JSON.stringify(state));
    });
  }

  if (observerOrListener) {
    service.subscribe(toObserver(observerOrListener) as any);
  }

  const rehydratedState = getRehydratedState<TMachine>(options);
  service.start((rehydratedState as any) ?? undefined);

  return service as any;
}
