import { InterpreterStatus } from 'xstate';

interface Stoppable {
  stop(): void;
  status: InterpreterStatus;
}

interface Destroyable {
  ngOnDestroy: () => void;
}

export class XstateTestCleaner {
  xstateServices: Stoppable[] = [];
  stateMachineServiceBaseObjects: Destroyable[] = [];

  addXstateService(service: Stoppable) {
    this.xstateServices.push(service);
  }

  addStateMachineServiceBase(stateMachineServiceBase: Destroyable) {
    this.stateMachineServiceBaseObjects.push(stateMachineServiceBase);
  }

  clean() {
    this.stopAllXstateServices();
    this.destroyAllStateMachineServiceBaseObjects();
  }

  private stopAllXstateServices() {
    this.xstateServices.forEach((service) => {
      service.stop();
      service.status = InterpreterStatus.NotStarted;
    });
    this.xstateServices = [];
  }

  private destroyAllStateMachineServiceBaseObjects() {
    this.stateMachineServiceBaseObjects.forEach((service) =>
      service.ngOnDestroy()
    );
    this.stateMachineServiceBaseObjects = [];
  }
}
