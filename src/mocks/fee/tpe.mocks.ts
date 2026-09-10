// Reemplazo del TpeService real: mismos métodos públicos, sin HttpClient, fixtures fijas.
// getMerchantReport SÍ simula el buscador real (searchText del query contra FeeCode/Acquirer
// ICA/Merchant Name/Merchant ID/Quantity/Converted Amount, igual que TpeMerchantReport.searchFields
// en el componente real) — antes ignoraba `searchText` y siempre devolvía la misma lista fija.
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { TpeReportParams, TpeSelectionParams } from '../../mirrors/fee/tpe/dto/tpe-commands.dto';
import {
  getTpeMccMerchantDetails,
  getTpeMerchantPenaltyDetails,
  getTpeTariff,
  resolveTpeMonthlyExpense,
  tpeClients,
  tpeFilterOptions,
  tpeMerchantNonComplianceSummary,
  tpeMerchantNonComplianceTopMerchant,
  tpeMerchantReportRows,
  tpeMerchantReportSummary,
  tpePenaltiesByFee,
  tpePenaltiesByMcc,
  tpePenaltiesOverview,
  tpeRating,
} from './tpe.data';

function matchesMerchantReportSearch(searchText: string | null | undefined, row: (typeof tpeMerchantReportRows)[number]): boolean {
  const term = searchText?.trim().toLowerCase();
  if (!term) return true;
  return [row.feeCode, row.ica, row.merchantName, String(row.merchantId ?? ''), String(row.quantityNumber), String(row.convertedAmount)].some(field => field.toLowerCase().includes(term));
}

export function createMockTpeService() {
  return {
    getClients: () => delayedOf(tpeClients),
    getFilters: () => delayedOf(tpeFilterOptions),
    getPenaltiesOverview: () => delayedOf(tpePenaltiesOverview),
    getMerchantNonCompliance: () => delayedOf({ merchantWithMostPenalties: tpeMerchantNonComplianceTopMerchant.merchantWithMostPenalties, totalMerchants: tpeMerchantNonComplianceSummary.totalMerchants }),
    getMerchantNonComplianceTopMerchant: () => delayedOf(tpeMerchantNonComplianceTopMerchant),
    getMerchantNonComplianceSummary: () => delayedOf(tpeMerchantNonComplianceSummary),
    getMonthlyExpense: (command: TpeSelectionParams) => delayedOf(resolveTpeMonthlyExpense(command.merchant ?? null, command.fees ?? null)),
    getPenaltiesByFee: () => delayedOf(tpePenaltiesByFee),
    getCurrentTariff: (_clientId: number, feeId: number) => delayedOf(getTpeTariff(feeId)),
    getPenaltiesByMcc: () => delayedOf(tpePenaltiesByMcc),
    getPenaltiesByMccDetails: (mccId: number) => delayedOf(getTpeMccMerchantDetails(mccId)),
    getPenaltiesByMerchantDetails: (merchantId: string) => delayedOf(getTpeMerchantPenaltyDetails(merchantId)),
    getMerchantReport: (params: TpeReportParams) => {
      const items = tpeMerchantReportRows.filter(row => matchesMerchantReportSearch(params?.searchText, row));
      // `summaries` es requerido por PaginationResponse<T> (dto/tpe-responses.dto.ts) aunque
      // TpeMerchantReport no lo lea hoy (usa el forkJoin con getMerchantReportSummary en su lugar) —
      // se completa igual para que la forma coincida con la real, no solo compile (ver la lección de
      // "PaginationResponse summary vs summaries" en README.md).
      return delayedOf({ items, totalCount: items.length, pageNumber: 1, pageSize: 10, summaries: [] });
    },
    getMerchantReportSummary: () => delayedOf(tpeMerchantReportSummary),
    downloadMerchantReport: () => of({ body: new Blob() } as any),
    downloadMerchantReportRawData: () => of({ body: new Blob() } as any),
    downloadMerchantReportZip: () => of({ body: new Blob() } as any),
    getRecommendations: () => delayedOf([]),
    getRating: () => delayedOf(tpeRating),
    sendMail: () => of(true),
    requestPermissionRecomendations: () => of(true),
  };
}
