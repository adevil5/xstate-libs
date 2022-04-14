/* eslint-disable @typescript-eslint/no-unused-vars */
import { assign, createMachine } from 'xstate';

export interface InstitutionLookupMachineContext {
  institutionNameSearchTerm: string;
  institutionLookupResults: string[];
}

export type InstitutionLookupMachineEvent = {
  type: 'FETCH';
  institutionNameSearchTerm: string;
};

export const institutionLookupMachine = createMachine<
  InstitutionLookupMachineContext,
  InstitutionLookupMachineEvent
>({
  id: 'institutionLookup',
  context: {
    institutionNameSearchTerm: '',
    institutionLookupResults: [],
  },
  initial: 'idle',
  on: {
    FETCH: {
      target: 'fetching',
      actions: assign({
        institutionNameSearchTerm: (_, evt) => evt.institutionNameSearchTerm,
      }),
    },
  },
  states: {
    idle: {},
    fetching: {
      invoke: {
        id: 'fetchInstitutionLookupResults',
        src: 'fetchInstitutionLookupResults',
        onDone: {
          target: 'idle',
          actions: assign({
            institutionLookupResults: (_, evt) => evt.data || [],
          }),
        },
        onError: { target: 'idle' },
      },
    },
  },
});
