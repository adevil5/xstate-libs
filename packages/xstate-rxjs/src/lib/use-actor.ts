/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorSubject, from, Observable } from 'rxjs';
import { ActorRef, EventObject, Sender } from 'xstate';

export function isActorWithState<T extends ActorRef<any>>(
  actorRef: T
): actorRef is T & { state: any } {
  return 'state' in actorRef;
}

function isDeferredActor<T extends ActorRef<any>>(
  actorRef: T
): actorRef is T & { deferred: boolean } {
  return 'deferred' in actorRef;
}

type EmittedFromActorRef<TActor extends ActorRef<any, any>> =
  TActor extends ActorRef<any, infer TEmitted> ? TEmitted : never;

function defaultGetSnapshot<TEmitted>(
  actorRef: ActorRef<any, TEmitted>
): TEmitted | undefined {
  return 'getSnapshot' in actorRef
    ? actorRef.getSnapshot()
    : isActorWithState(actorRef)
    ? actorRef.state
    : undefined;
}

export function useActor<TActor extends ActorRef<any, any>>(
  actorRef: TActor,
  getSnapshot?: (actor: TActor) => EmittedFromActorRef<TActor>
): { current$: Observable<EmittedFromActorRef<TActor>>; send: TActor['send'] };
export function useActor<TEvent extends EventObject, TEmitted>(
  actorRef: ActorRef<TEvent, TEmitted>,
  getSnapshot?: (actor: ActorRef<TEvent, TEmitted>) => TEmitted
): { current$: Observable<TEmitted>; send: Sender<TEvent> };
export function useActor(
  actorRef: ActorRef<EventObject, unknown>,
  getSnapshot: (
    actor: ActorRef<EventObject, unknown>
  ) => unknown = defaultGetSnapshot
): { current$: Observable<unknown>; send: Sender<EventObject> } {
  const deferredEventsSubject = new BehaviorSubject<(EventObject | string)[]>(
    []
  );

  const current$ = from(actorRef);

  const send: Sender<EventObject> = (...args: any[]) => {
    const event = args[0];

    if (process.env['NODE_ENV'] !== 'production' && args.length > 1) {
      console.warn(
        `Unexpected payload: ${JSON.stringify(
          (args as any)[1]
        )}. Only a single event object can be sent to actor send() functions.`
      );
    }

    // If the previous actor is a deferred actor,
    // queue the events so that they can be replayed
    // on the non-deferred actor.
    if (isDeferredActor(actorRef) && actorRef.deferred) {
      deferredEventsSubject.value.push(event);
    } else {
      actorRef.send(event);
    }
  };

  // Dequeue deferred events from the previous deferred actorRef
  while (deferredEventsSubject.value.length > 0) {
    const deferredEvent = deferredEventsSubject.value.shift();
    if (deferredEvent) {
      actorRef.send(deferredEvent);
    }
  }

  return { current$, send };
}
