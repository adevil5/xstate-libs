import { ComponentFixture, TestBed } from '@angular/core/testing';
import { createMachine } from 'xstate';

import { StateMachineBaseComponent } from './state-machine-base.component';

import { fetchMachine } from '../../../../test-machines/fetch/fetch.machine';

describe('StateMachineBaseComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StateMachineBaseComponent],
    }).compileComponents();
  });

  test('should create', () => {
    const fixture = TestBed.createComponent(StateMachineBaseComponent);
    const component = fixture.componentInstance;
    const machine = createMachine({
      initial: 'active',
      states: {
        active: {},
      },
    });
    component.machine = machine;
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  test('should work with StateMachineBaseComponent', () => {
    const fixture: ComponentFixture<
      StateMachineBaseComponent<typeof fetchMachine>
    > = TestBed.createComponent(StateMachineBaseComponent);
    const component = fixture.componentInstance;
    component.machine = fetchMachine;
    component.machineOptions = [
      {
        services: { fetchData: () => Promise.resolve('fake data') },
      },
    ];
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});
