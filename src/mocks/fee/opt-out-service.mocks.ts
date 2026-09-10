// Reemplazo del OptOutServicesService real: mismos métodos públicos, sin HttpClient, fixtures fijas.
// `buildCardSignal` se reimplementa igual que el real (es lógica pura de RxJS/signals, no pega a
// HTTP) porque OptOutServicesDashboard la llama directo sobre la instancia inyectada — si el mock
// no la trae, truena con "buildCardSignal is not a function".
import { Signal, WritableSignal } from '@angular/core';
import { QueryParametersModel } from 'intelica-library-project';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, distinctUntilChanged, filter, finalize, map, Observable, of, switchMap } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { OptOutServiceFilter, OptOutServiceFilterCommand } from '../../mirrors/fee/opt-out-service/dto/opt-out-service-commands.dto';
import { OptOutSavingsListResponse, TopOptOutSubscriptionsListResponse, UpcomingListResponse } from '../../mirrors/fee/opt-out-service/dto/opt-out-service-responses.dto';
import {
  optOutBillingGraph,
  optOutFilterOptions,
  optOutFlowVisaRiskEssentials,
  optOutSavingsCard,
  optOutSavingsListSummary,
  optOutSavingsSummary,
  optOutSubscriptionsCard,
  optOutTopSubscriptionsSummary,
  optOutUpcomingCard,
  optOutUpcomingSummary,
} from './opt-out-service.data';

function matchesText(search: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  const term = search?.trim().toLowerCase();
  if (!term) return true;
  return fields.some(field => (field ?? '').toLowerCase().includes(term));
}

export function createMockOptOutServiceService() {
  function mapToCommand(filterValue: OptOutServiceFilter): OptOutServiceFilterCommand {
    const [from, to] = filterValue.dates ?? [];
    return new OptOutServiceFilterCommand({
      bankId: filterValue.bankId,
      brandId: filterValue.brandId,
      businessId: filterValue.businessId,
      startDate: from ? from.toISOString().slice(0, 10) : '',
      endDate: to ? to.toISOString().slice(0, 10) : '',
      pageNumber: 1,
      pageSize: 10,
    });
  }

  function buildCardSignal<T>(
    loader: (command: OptOutServiceFilterCommand) => Observable<T>,
    loadingSignal: WritableSignal<boolean>,
    filterSignal: Signal<OptOutServiceFilter>,
    commandOverride?: (base: OptOutServiceFilterCommand) => OptOutServiceFilterCommand,
    refreshSignal?: Signal<number>
  ) {
    const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);
    return toSignal<T | null>(
      combineLatest([toObservable(filterSignal), refresh]).pipe(
        filter(([f]) => f.brandId.length > 0 || f.businessId.length > 0),
        map(([f, r]) => {
          let command = mapToCommand(f);
          if (commandOverride) command = commandOverride(command);
          const key = [r, command.bankId.join(','), command.brandId.join(','), command.businessId.join(','), command.startDate, command.endDate].join('|');
          return { command, key };
        }),
        distinctUntilChanged((a, b) => a.key === b.key),
        switchMap(({ command }) => {
          loadingSignal.set(true);
          return loader(command).pipe(
            catchError(() => of(null)),
            finalize(() => loadingSignal.set(false))
          );
        }),
        catchError(() => {
          loadingSignal.set(false);
          return of(null);
        })
      ),
      { initialValue: null }
    );
  }

  // Firma real (OptOutServicesService.buildTableSignal): a diferencia de buildCardSignal, ESTA
  // también recibe `queryParamsSignal` y vuelca FilterValue/OrderBy/SortDirection/PageNumber/
  // PageSize dentro del command (`command.searchText`, etc.) — el mock anterior delegaba a
  // buildCardSignal (3 args) e ignoraba por completo esos 3 parámetros extra, así que el buscador
  // de Top Subscriptions/Upcoming Opt-Outs nunca llegaba a filtrar nada.
  function buildTableSignal<T>(
    loader: (cmd: OptOutServiceFilterCommand) => Observable<T>,
    loadingSignal: WritableSignal<boolean>,
    filterSignal: Signal<OptOutServiceFilter>,
    queryParamsSignal: Signal<QueryParametersModel>,
    commandOverride?: (base: OptOutServiceFilterCommand) => OptOutServiceFilterCommand,
    refreshSignal?: Signal<number>
  ) {
    const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);
    return toSignal<T | null>(
      combineLatest([toObservable(filterSignal), toObservable(queryParamsSignal), refresh]).pipe(
        filter(([f]) => f.brandId.length > 0 || f.businessId.length > 0),
        map(([f, queryParams, r]) => {
          let command = mapToCommand(f);
          if (commandOverride) {
            command = commandOverride(command);
          } else {
            command.pageNumber = queryParams.PageNumber ?? 1;
            command.pageSize = queryParams.PageSize ?? 10;
            command.sortField = queryParams.OrderBy ?? '';
            command.searchText = queryParams.FilterValue ?? '';
          }
          const key = [r, command.bankId.join(','), command.brandId.join(','), command.businessId.join(','), command.startDate, command.endDate, command.pageNumber, command.pageSize, command.sortField, command.searchText].join('|');
          return { command, key };
        }),
        distinctUntilChanged((a, b) => a.key === b.key),
        switchMap(({ command }) => {
          loadingSignal.set(true);
          return loader(command).pipe(
            catchError(() => of(null)),
            finalize(() => loadingSignal.set(false))
          );
        }),
        catchError(() => {
          loadingSignal.set(false);
          return of(null);
        })
      ),
      { initialValue: null }
    );
  }

  function buildEntitySignal<TCommand, TResponse>(commandSignal: Signal<TCommand | null>, loader: (command: TCommand) => Observable<TResponse>, loadingSignal: WritableSignal<boolean>) {
    return toSignal<TResponse | null>(
      toObservable(commandSignal).pipe(
        filter((cmd): cmd is TCommand => !!cmd),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        switchMap(command => {
          loadingSignal.set(true);
          return loader(command).pipe(
            catchError(() => of(null)),
            finalize(() => loadingSignal.set(false))
          );
        })
      ),
      { initialValue: null }
    );
  }

  return {
    getFilters: () => delayedOf(optOutFilterOptions),
    getSubscriptionsCard: () => delayedOf(optOutSubscriptionsCard),
    getSavingsCard: () => delayedOf(optOutSavingsCard),
    getUpcomingCard: () => delayedOf(optOutUpcomingCard),
    getBillingGraph: () => delayedOf(optOutBillingGraph),
    getSubscriptionsSummary: () => delayedOf({ issuerAmount: 0, acquirerAmount: 0, memberAmount: 0, totalAmount: 0 }),
    getSavingsSummary: () => delayedOf(optOutSavingsSummary),
    getUpcomingSummary: () => delayedOf({ pendingOptOuts: 0, totalEstimatedCost: 0, totalAnnouncements: 0, totalAnnualForecast: 0 }),
    // OJO: el campo real es `summary` (singular, un objeto), no `summaries` — los componentes leen
    // `dataResponse()?.summary.items`/`.totalAmount` sin optional-chaining en `.summary`, así que un
    // mock sin ese campo revienta en runtime aunque compile bien (ver PaginationResponse<T> en
    // common/DTO/common-response.ts).
    // Ambas SÍ simulan el buscador real (command.searchText, ya cableado por buildTableSignal más
    // arriba, contra los mismos campos que declaran TopOptOutSubscriptions.searchFields/
    // UpcomingOptOuts.searchFields) — antes ignoraban el command entero y siempre devolvían la
    // misma lista fija sin importar lo que se tipeara.
    getSubscriptionsTable: (command: OptOutServiceFilterCommand) => {
      const items = optOutTopSubscriptionsSummary.items.filter((row: TopOptOutSubscriptionsListResponse) =>
        matchesText(command?.searchText, row.opcBusinessName, row.opcName, row.feeCode, row.feeName, row.clientName)
      );
      const totalAmount = items.reduce((sum, row) => sum + row.amount, 0);
      return delayedOf({ items: [], totalCount: items.length, pageNumber: 1, pageSize: 10, summary: { ...optOutTopSubscriptionsSummary, items, totalAmount } });
    },
    getUpcomingTable: (command: OptOutServiceFilterCommand) => {
      const items = optOutUpcomingSummary.items.filter((row: UpcomingListResponse & { opcName?: string }) =>
        matchesText(command?.searchText, row.announcementTitle, row.announcementCode, row.announcementBusinessName, row.opcName, row.clientName)
      );
      // totalAnnouncements/totalPendings son estadísticas generales (igual que inboxCount en Alerts
      // o los cards de Fee Updates) — no cambian con la búsqueda, solo la lista `.items` se filtra.
      return delayedOf({ items: [], totalCount: items.length, pageNumber: 1, pageSize: 10, summary: { ...optOutUpcomingSummary, items } });
    },
    // Mismo patrón que getSubscriptionsTable/getUpcomingTable: sí simula el buscador real
    // (command.searchText contra los mismos campos que declara OptOutSavings.searchFields), y
    // totalBilled/monthlySavings/annualSavings se recalculan sobre el subconjunto filtrado en vez
    // de devolver siempre los totales fijos (antes esta tabla ni siquiera traía fixtures: siempre
    // devolvía items: [] y totales en 0 — gap ya documentado, ver README).
    getSavingsTable: (command: OptOutServiceFilterCommand) => {
      const items = optOutSavingsListSummary.items.filter((row: OptOutSavingsListResponse) =>
        matchesText(command?.searchText, row.opcName, row.feeCode, row.feeName, row.opcBusinessName, row.clientName)
      );
      const totalBilled = items.reduce((sum, row) => sum + row.amountBilled, 0);
      const monthlySavings = items.reduce((sum, row) => sum + row.amountMonthlySavings, 0);
      const annualSavings = items.reduce((sum, row) => sum + row.amountAnnualSavings, 0);
      return delayedOf({ items: [], totalCount: items.length, pageNumber: 1, pageSize: 10, summary: { totalBilled, monthlySavings, annualSavings, items } });
    },
    downloadSubscriptions: () => of(new Blob() as any),
    downloadSavings: () => of(new Blob() as any),
    downloadUpcoming: () => of(new Blob() as any),
    downloadBilling: () => of(new Blob() as any),
    // Un solo fixture "insignia" (Visa Risk Essentials Program) sin importar el cmd (bankId/opcId)
    // recibido — mismo patrón que Fee Detail (ignora feeId/bankId reales de la URL).
    getUnsubscribe: () => delayedOf(optOutFlowVisaRiskEssentials),
    upsertUnsubscribe: () => of({} as any),
    downloadDocument: () => of(new Blob() as any),
    getFeesByDocumentConfiguration: () => of([]),
    downloadFile: () => {},
    viewFile: () => {},
    getFileNameFromHeader: () => null,
    setFilterOptions: () => {},
    isApplying: () => false,
    buildCardSignal,
    buildTableSignal,
    buildEntitySignal,
  };
}
