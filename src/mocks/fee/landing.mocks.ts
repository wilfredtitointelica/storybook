// Reemplazo del LandingService real: mismos métodos públicos, sin HttpClient, fixtures fijas.
// buildLandingSignal/buildLandingParamSignal/ResolveState/GetTrendIcon son helpers puros (sin
// HttpClient) que los componentes hijos (fee-expense, net-fees, perfomance-score, opportunities,
// announcements, unit-cost) llaman DIRECTO sobre la instancia inyectada de LandingService -> hay
// que reimplementarlos igual que en createMockOptOutServiceService/buildCardSignal, si no
// "this.landingService.buildLandingSignal is not a function" apenas se monte cualquier widget.
import { Signal, WritableSignal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, combineLatest, finalize, map, Observable, of, switchMap } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { getLandingMainOpportunities, getLandingUnitCostByProduct, landingFeeExpenses, landingPerformanceScore, landingUpcomingAnnouncements } from './landing.data';

function buildLandingSignal<T>(loader: () => Observable<T>, loadingSignal: WritableSignal<boolean>, refreshSignal?: Signal<number>, errorSignal?: WritableSignal<boolean>) {
  const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);
  return toSignal<T | null>(
    refresh.pipe(
      distinctUntilChanged(),
      switchMap(() => {
        loadingSignal.set(true);
        errorSignal?.set(false);
        return loader().pipe(
          catchError(() => {
            errorSignal?.set(true);
            return of(null);
          }),
          finalize(() => loadingSignal.set(false))
        );
      }),
      catchError(() => {
        loadingSignal.set(false);
        errorSignal?.set(true);
        return of(null);
      })
    ),
    { initialValue: null }
  );
}

function buildLandingParamSignal<T, TParam>(
  loader: (param: TParam) => Observable<T>,
  paramSignal: Signal<TParam>,
  loadingSignal: WritableSignal<boolean>,
  refreshSignal?: Signal<number>,
  errorSignal?: WritableSignal<boolean>
) {
  const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);
  return toSignal<T | null>(
    combineLatest([toObservable(paramSignal), refresh]).pipe(
      map(([param, refresh]) => ({ param, key: JSON.stringify({ param, refresh }) })),
      distinctUntilChanged((a, b) => a.key === b.key),
      switchMap(({ param }) => {
        loadingSignal.set(true);
        errorSignal?.set(false);
        return loader(param).pipe(
          catchError(() => {
            errorSignal?.set(true);
            return of(null);
          }),
          finalize(() => loadingSignal.set(false))
        );
      }),
      catchError(() => {
        loadingSignal.set(false);
        errorSignal?.set(true);
        return of(null);
      })
    ),
    { initialValue: null }
  );
}

function resolveState(value: number): 'positive' | 'negative' | 'neutral' {
  if (value > 0) return 'negative';
  if (value < 0) return 'positive';
  return 'neutral';
}

function getTrendIcon(value: number): string {
  if (value > 0) return 'icon-nav-up';
  if (value < 0) return 'icon-nav-down';
  return 'icon-nav-neutral';
}

export function createMockLandingService() {
  return {
    getFeeExpenses: () => delayedOf(landingFeeExpenses),
    getPerformanceScore: () => delayedOf(landingPerformanceScore),
    getMainOpportunities: (categoryId: number) => delayedOf(getLandingMainOpportunities(categoryId)),
    getUpcomingAnnouncements: () => delayedOf(landingUpcomingAnnouncements),
    getUnitCostByProduct: (unitCostTypeId: number, businessTransactionId: number) => delayedOf(getLandingUnitCostByProduct(unitCostTypeId, businessTransactionId)),
    sendAnalytics: () => of(true),
    buildLandingSignal,
    buildLandingParamSignal,
    ResolveState: resolveState,
    GetTrendIcon: getTrendIcon,
  };
}
