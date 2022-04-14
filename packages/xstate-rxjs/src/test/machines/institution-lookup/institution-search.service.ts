import { StateMachineServiceBase } from '../../../lib/state-machine-service-base';
import { institutionLookupMachine } from './institution-lookup.machine';
import { MOCK_INSTITUTIONS } from './institution.model';

export class InstitutionLookupService extends StateMachineServiceBase<
  typeof institutionLookupMachine
> {
  constructor() {
    super(institutionLookupMachine, {
      services: {
        fetchInstitutionLookupResults: (context) =>
          this.mockFetchInstitutionLookupResults(
            context.institutionNameSearchTerm
          ),
      },
    });
  }

  async mockFetchInstitutionLookupResults(
    institutionNameSearchTerm: string
  ): Promise<string[]> {
    const response = MOCK_INSTITUTIONS.filter((x) =>
      x.name.toLowerCase().includes(institutionNameSearchTerm.toLowerCase())
    );
    await this.sleep(0);
    return response.map((x) => x.name);
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
