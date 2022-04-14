import {
  ChangeDetectionStrategy,
  Component,
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

@Component({
  selector: 'x-state-machine-base',
  templateUrl: './state-machine-base.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMachineBaseComponent<TMachine extends AnyStateMachine>
  implements OnInit, OnDestroy
{
  @Input() machine!: MaybeLazy<TMachine>;
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
