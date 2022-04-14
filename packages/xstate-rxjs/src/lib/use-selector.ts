/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay,
  startWith,
} from 'rxjs';
import { ActorRef, AnyInterpreter, Subscribable } from 'xstate';

import { isActorWithState } from './use-actor';
import { toObserver } from './use-interpret';
import { getServiceSnapshot } from './utils';

function isService(actor: any): actor is AnyInterpreter {
  return 'state' in actor && 'machine' in actor;
}

const defaultCompare = (a: any, b: any) => a === b;
const defaultGetSnapshot = (a: any) =>
  isService(a)
    ? getServiceSnapshot(a)
    : isActorWithState(a)
    ? a.state
    : undefined;

export function useSelector<
  TActor extends ActorRef<any, any>,
  T,
  TEmitted = TActor extends Subscribable<infer Emitted> ? Emitted : never
>(
  actor: TActor,
  selector: (emitted: TEmitted) => T,
  compare: (a: T, b: T) => boolean = defaultCompare,
  getSnapshot: (a: TActor) => TEmitted = defaultGetSnapshot
): Observable<T> {
  const current = selector(getSnapshot(actor));
  const selectSubject = new BehaviorSubject(current);
  const select$ = selectSubject
    .asObservable()
    .pipe(startWith(current), distinctUntilChanged(compare), shareReplay(1));

  actor.subscribe(
    toObserver<TEmitted>(
      (emitted: TEmitted) => {
        selectSubject.next(selector(emitted));
      },
      (err) => {
        selectSubject.error(err);
      }
    )
  );

  return select$;
}
