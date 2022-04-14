import { createMachine } from 'xstate';
import { StateMachineDirective } from './state-machine.directive';

describe('StateMachineDirective', () => {
  it('should create an instance', () => {
    const directive = new StateMachineDirective();
    const machine = createMachine({
      initial: 'active',
      states: {
        active: {},
      },
    });
    directive.machine = machine;

    expect(directive).toBeTruthy();
  });
});
