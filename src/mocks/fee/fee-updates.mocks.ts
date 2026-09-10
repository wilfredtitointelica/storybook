// Reemplazo del FeeUpdatesService real: mismos métodos públicos, sin HttpClient, fixtures fijas.
// getNewFees/getTariffChanges/getCeasedFees SÍ simulan el buscador real (searchText del query
// contra feeCode/feeName, igual que cualquier tabla con [ShowSearch]="true" en la plataforma) —
// antes ignoraban `search` y siempre devolvían la misma lista fija sin importar lo que se tipeara.
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { FeeUpdatesTableQuery } from '../../mirrors/fee/fee-updates/dto/fee-updates-commands.dto';
import { feeUpdatesCeasedFees, feeUpdatesFiltersBootstrap, feeUpdatesNewFees, feeUpdatesSummary, feeUpdatesTariffChanges } from './fee-updates.data';

function matches(search: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return fields.some(field => (field ?? '').toLowerCase().includes(term));
}

export function createMockFeeUpdatesService() {
  return {
    getFiltersBootstrap: () => delayedOf(feeUpdatesFiltersBootstrap),
    getSummary: () => delayedOf(feeUpdatesSummary),
    getNewFees: (query: FeeUpdatesTableQuery) => {
      const items = feeUpdatesNewFees.items.filter(item => matches(query.search, item.feeCode, item.feeName));
      return delayedOf({ ...feeUpdatesNewFees, items, totalCount: items.length });
    },
    getTariffChanges: (query: FeeUpdatesTableQuery) => {
      const items = feeUpdatesTariffChanges.items.filter(item => matches(query.search, item.feeCode, item.feeName));
      return delayedOf({ ...feeUpdatesTariffChanges, items, totalCount: items.length });
    },
    getCeasedFees: (query: FeeUpdatesTableQuery) => {
      const items = feeUpdatesCeasedFees.items.filter(item => matches(query.search, item.feeCode, item.feeName));
      return delayedOf({ ...feeUpdatesCeasedFees, items, totalCount: items.length });
    },
    exportTab: () => of(new HttpResponse({ body: new Blob() })),
  };
}
