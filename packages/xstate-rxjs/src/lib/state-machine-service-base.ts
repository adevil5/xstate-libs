/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyStateMachine, InterpreterStatus } from 'xstate';

import { MaybeLazy, UseMachineRestParams } from './types';
import { useMachine as useMachine } from './use-machine';

export class StateMachineServiceBase<TMachine extends AnyStateMachine> {
  state$;
  send;
  service;
  select;

  constructor(
    getMachine: MaybeLazy<TMachine>,
    ...[options = {}]: UseMachineRestParams<TMachine>
  ) {
    const useMachineReturn = useMachine(getMachine, options);
    this.state$ = useMachineReturn.state$;
    this.send = useMachineReturn.send;
    this.service = useMachineReturn.service;
    this.select = useMachineReturn.select;
  }

  // inherited by angular services?
  ngOnDestroy() {
    this.service.stop();
    this.service.status = InterpreterStatus.NotStarted;
  }

  // useActorById<
  //   ActorRefTyped extends ActorRef<TEvent, TEmitted> = ActorRef<any, any>,
  //   TEvent extends EventObject = EventObject,
  //   TEmitted = unknown
  // >(
  //   actorRefId: string
  // ): {
  //   current$: Observable<TEmitted | undefined>;
  //   send: Sender<TEvent>;
  // } {
  //   const localActorRef = this.service.children.get(
  //     actorRefId
  //   ) as ActorRefTyped;

  //   if (!localActorRef) {
  //     throw new Error(`Actor ${actorRefId} not found`);
  //   }

  //   const x = useActor<TEvent, TEmitted>(localActorRef); /*? */
  //   return x;
  // }

  // useActorByRef<TypedActorState = unknown>(
  //   actorRef: ActorRef<EventObject, TypedActorState>
  // ): {
  //   current$: Observable<TypedActorState | undefined>;
  //   send: Sender<EventObject>;
  // } {
  //   return useActor(actorRef);
  // }
}
