// Reemplazo del LibraryService real: mismos métodos, sin HttpClient, devuelve fixtures fijas.
// getFeeUnallocated/getFeeAllocated SÍ simulan el buscador real (codeNameFee del filtro contra
// feeCode/feeName, igual que Original.searchFields/Allocated.searchFields en el componente real) —
// antes ignoraban el filtro y siempre devolvían la misma lista fija sin importar lo que se tipeara.
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { FeeLibraryFilter } from '../../mirrors/fee/library/DTO/request';
import { CurrencyTotal, FeeResponse } from '../../mirrors/fee/library/DTO/response';
import {
  libraryAllocatedPage,
  libraryAllocatedRows,
  libraryClientInformation,
  libraryDates,
  libraryEntityProducts,
  libraryExcludedRows,
  libraryGroupNames,
  libraryInvoices,
  libraryMasters,
  libraryRefundRows,
  libraryResumeAllocated,
  libraryResumeUnallocated,
  libraryUnallocatedPage,
  libraryUnallocatedRows,
} from './library.data';

function matchesSearch(codeNameFee: string | undefined, row: FeeResponse): boolean {
  const term = codeNameFee?.trim().toLowerCase();
  if (!term) return true;
  return (row.feeDetail?.code ?? '').toLowerCase().includes(term) || (row.feeDetail?.name ?? '').toLowerCase().includes(term);
}

function sumByCurrency(rows: FeeResponse[]): CurrencyTotal[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const currency of row.currencyDetailList ?? []) {
      if (!currency.code) continue;
      totals.set(currency.code, (totals.get(currency.code) ?? 0) + currency.feeAmount);
    }
  }
  return Array.from(totals.entries()).map(([code, totalAmount]) => ({ code, totalAmount }));
}

function sumEur(rows: FeeResponse[]): number {
  return rows.reduce((sum, row) => sum + (row.currencyDetailList?.find(c => c.code === 'EUR')?.feeAmount ?? 0), 0);
}

export function createMockLibraryService(options?: { empty?: boolean }) {
  return {
    getMasters: () => delayedOf(libraryMasters),
    listPeriodDates: () => delayedOf([]),
    getLibraryDates: () => delayedOf(libraryDates),
    getClientInformation: () => delayedOf(libraryClientInformation),
    getFeeUnallocated: (filter: FeeLibraryFilter) => {
      const items = options?.empty ? [] : libraryUnallocatedRows.filter(row => matchesSearch(filter?.codeNameFee, row));
      return delayedOf({
        pagination: { ...libraryUnallocatedPage.pagination, items, totalCount: items.length },
        currencyTotals: options?.empty ? [] : sumByCurrency(items),
      });
    },
    getResumeFeeUnallocated: () => delayedOf(libraryResumeUnallocated),
    downloadFeeUnallocated: () => of(new Blob()),
    getFeeAllocated: (filter: FeeLibraryFilter) => {
      const items = options?.empty ? [] : libraryAllocatedRows.filter(row => matchesSearch(filter?.codeNameFee, row));
      return delayedOf({
        pagination: { ...libraryAllocatedPage.pagination, items, totalCount: items.length },
        totalFeeAmount: options?.empty ? 0 : sumEur(items),
      });
    },
    getResumeFeeAllocated: () => delayedOf(libraryResumeAllocated),
    downloadFeeAllocated: () => of(new Blob()),
    // 6 filas reales de la captura (ver comentario junto a libraryRefundRows en library.data.ts) —
    // el total mostrado en esta demo (suma client-side de estas 6 filas) no coincide con el total
    // de la captura real (dataset completo más grande, con paginación/scroll), a propósito.
    getFeeRefund: () => delayedOf(options?.empty ? [] : libraryRefundRows),
    downloadFeeRefund: () => of(new Blob()),
    exportIncentivesFromList: () => of(new Blob()),
    // 6 filas reales de la captura (ver comentario junto a libraryExcludedRows en library.data.ts) —
    // mismo caso de total-no-coincide-con-captura que getFeeRefund arriba.
    getFeeExcluded: () => delayedOf(options?.empty ? [] : libraryExcludedRows),
    exportExcludedFromList: () => of(new Blob()),
    downloadFeeExcluded: () => of(new Blob()),
    getFeeGroupView: () => delayedOf([]),
    downloadFeeGroupView: () => of(new Blob()),
    // El servicio real filtra por bankId/startDate/endDate/brandIds; acá se devuelve siempre el
    // mismo fixture pequeño (5 facturas) sin importar los params — mismo patrón "un solo fixture
    // insignia" que el resto del proyecto, ver modal-advanced-filter.ts scheduleInvoiceLoad().
    getInvoices: () => delayedOf(libraryInvoices),
    // El servicio real filtra por (bankId, entityTypeId, entityValue); acá sí se filtra por
    // entityTypeId (contra prodCatId del fixture) porque es trivial y evita que la cascada
    // ICA/BID/NUMID/SRENUMID muestre productos de un tipo de entidad distinto al seleccionado.
    getProducts: (_bankId: string, entityTypeId?: number | null) =>
      delayedOf(entityTypeId ? libraryEntityProducts.filter(p => p.prodCatId === entityTypeId) : libraryEntityProducts),
    searchGroupNames: (_bankId: string, _allocated: boolean, search: string) => {
      const term = (search ?? '').trim().toLowerCase();
      const results = term ? libraryGroupNames.filter(g => g.name.toLowerCase().includes(term)) : libraryGroupNames;
      return delayedOf(results);
    },
    saveClientFeeRelation: () => of({}),
  };
}
