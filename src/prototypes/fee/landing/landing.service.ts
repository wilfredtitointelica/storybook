import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, Signal, WritableSignal } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { RequestCacheService } from "intelica-library-project";
import { catchError, combineLatest, distinctUntilChanged, finalize, map, Observable, of, switchMap } from "rxjs";
import {
	BannerFinancialImpactResponse,
	FeeExpensesResponse,
	MainOpportunitiesResponse,
	NetFeesBySchemeResponse,
	PerformanceScoreResponse,
	TotalFeeExpenseResponse,
	UnitCostByProductResponse,
	UpcomingAnnouncementsResponse,
} from "./dto/landing-responses.dto";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";

@Injectable({
	providedIn: "root",
})
export class LandingService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly requestCache = inject(RequestCacheService);
	private readonly path = `${this.configService.environment?.feePath}/landing`;

	public getFeeExpenses(): Observable<FeeExpensesResponse> {
		return this.cachedGet<FeeExpensesResponse>(`${this.path}/get-fee-expenses`, undefined);
	}

	public getPerformanceScore(): Observable<PerformanceScoreResponse> {
		return this.cachedGet<PerformanceScoreResponse>(`${this.path}/performance-score`, undefined);
	}

	public getMainOpportunities(categoryId: number): Observable<MainOpportunitiesResponse> {
		return this.cachedGet<MainOpportunitiesResponse>(`${this.path}/main-opportunities/category/${categoryId}`, undefined);
	}

	public getUpcomingAnnouncements(): Observable<UpcomingAnnouncementsResponse> {
		return this.cachedGet<UpcomingAnnouncementsResponse>(`${this.path}/upcoming-announcements`, undefined);
	}

	public getUnitCostByProduct(unitCostTypeId: number, businessTransactionId: number): Observable<UnitCostByProductResponse> {
		return this.cachedGet<UnitCostByProductResponse>(`${this.path}/unit-cost-by-product/unit-cost-type/${unitCostTypeId}/business-transaction/${businessTransactionId}`, undefined);
	}

	public sendAnalytics(): Observable<boolean> {
		return this.http.get<boolean>(`${this.path}/send/analytics`);
	}

	private cachedGet<T>(url: string, params: HttpParams | undefined, ttlMs?: number): Observable<T> {
		const key = this.buildCacheKey(url, params);
		return this.requestCache.getOrSet(key, () => this.http.get<T>(url, { params }), ttlMs);
	}

	private buildCacheKey(url: string, params?: HttpParams): string {
		const paramsKey = params?.toString() ?? "";
		return `${url}::${paramsKey}`;
	}

	public buildLandingSignal<T>(loader: () => Observable<T>, loadingSignal: WritableSignal<boolean>, refreshSignal?: Signal<number>, errorSignal?: WritableSignal<boolean>) {
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

	public buildLandingParamSignal<T, TParam>(
		loader: (param: TParam) => Observable<T>,
		paramSignal: Signal<TParam>,
		loadingSignal: WritableSignal<boolean>,
		refreshSignal?: Signal<number>,
		errorSignal?: WritableSignal<boolean>
	) {
		const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);

		return toSignal<T | null>(
			combineLatest([toObservable(paramSignal), refresh]).pipe(
				map(([param, refresh]) => ({
					param,
					key: JSON.stringify({ param, refresh }),
				})),
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

	public ResolveState(value: number): "positive" | "negative" | "neutral" {
		if (value > 0) return "negative";
		if (value < 0) return "positive";
		return "neutral";
	}

	public GetTrendIcon(value: number): string {
		if (value > 0) return "icon-nav-up";
		if (value < 0) return "icon-nav-down";
		return "icon-nav-neutral";
	}
}
