// Reemplazo del AlertsService real: mismos métodos públicos, sin HttpClient, fixtures fijas.
// `refreshTrigger` tiene que ser un signal REAL (no un valor plano): AlertsListComponent hace
// `toObservable(this.alertsService.refreshTrigger)`, que solo acepta un Signal<T> real.
import { HttpResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { AlertDetailQueryParams, AlertsQueryParams } from '../../mirrors/fee/alerts/dto/alerts-commands.dto';
import { AlertsListResponse } from '../../mirrors/fee/alerts/dto/alerts-responses.dto';
import { alertsInboxCards, alertsReadCards, getAlertDetailFixture } from './alerts.data';

export function createMockAlertsService() {
  const refreshTrigger = signal(0);

  return {
    refreshTrigger,
    getAlerts: (params: AlertsQueryParams) => {
      const source = params.tab === 'inbox' ? alertsInboxCards : alertsReadCards;
      const search = params.searchText?.trim().toLowerCase();
      const filtered = search ? source.filter(card => card.alertTypeName.toLowerCase().includes(search) || card.brands.some(b => b.toLowerCase().includes(search))) : source;
      const response: AlertsListResponse = {
        alerts: filtered,
        totalCount: filtered.length,
        inboxCount: alertsInboxCards.length,
        readCount: alertsReadCards.length,
      };
      return delayedOf(response);
    },
    getAlertDetail: (params: AlertDetailQueryParams) => delayedOf(getAlertDetailFixture(params.alertType, params.createdRealDate)),
    getClientInformation: () => delayedOf({ regions: [], countries: [], banks: [], groups: [], brands: [] }),
    markAsRead: () => {
      refreshTrigger.update(v => v + 1);
      return of(void 0);
    },
    markAsViewed: () => of(void 0),
    exportAlerts: () => of(new HttpResponse({ body: new Blob() })),
  };
}
