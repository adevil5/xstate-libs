import {
  Directive,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  MaybeLazy,
  StateMachineServiceBase,
  UseMachineRestParams,
} from '@xstate-libs/rxjs';
import { AnyStateMachine } from 'xstate';

@Directive({
  selector: '[xStateMachine]',
})
export class StateMachineDirective<TMachine extends AnyStateMachine>
  implements OnInit, OnDestroy
{
  @Input('xStateMachine') machine!: MaybeLazy<TMachine>;
  @Input() machineOptions: UseMachineRestParams<TMachine> = [{}];

  @Output() stateMachineServiceReady = new EventEmitter<
    StateMachineServiceBase<TMachine>
  >();

  private stateMachineService!: StateMachineServiceBase<TMachine>;

  ngOnInit(): void {
    if (!this.machine) {
      throw new Error('machine is required');
    }

    this.stateMachineService = new StateMachineServiceBase(
      this.machine,
      ...this.machineOptions
    );
    this.stateMachineServiceReady.emit(this.stateMachineService);
  }

  ngOnDestroy(): void {
    this.stateMachineService.ngOnDestroy();
  }
}
