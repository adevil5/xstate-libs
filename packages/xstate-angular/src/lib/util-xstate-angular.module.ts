import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { StateMachineBaseComponent } from './components/state-machine-base/state-machine-base.component';
import { StateMachineDirective } from './directives/state-machine/state-machine.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [StateMachineBaseComponent, StateMachineDirective],
  exports: [StateMachineBaseComponent, StateMachineDirective],
})
export class UtilXstateAngularModule {}
