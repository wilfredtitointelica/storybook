import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { RequestCacheService } from "intelica-library-project";
import { Observable, of } from "rxjs";
import { SendMailCommand, TpeRangeIcasParams, TpeRangeParams, TpeReportParams, TpeSelectionParams } from "./dto/tpe-commands.dto";
import {
	ClientCountryTpeResponse,
	FiltersTpeResponse,
	MerchantNonComplianceResponse,
	MerchantNonComplianceSummaryResponse,
	MerchantNonComplianceTopMerchantResponse,
	MerchantReportResponse,
	MerchantReportSummaryResponse,
	MonthlyExpenseResponse,
	PaginationResponse,
	PenaltyFeeResponse,
	PenaltyFeesOverviewResponse,
	PenaltyMccDetailResponse,
	PenaltyMccResponse,
	PenaltyMerchantDetailResponse,
	RatingResponse,
	RecommendationResponse,
	TariffDetailPopupSimpleResponse,
} from "./dto/tpe-responses.dto";

@Injectable({
	providedIn: "root",
})
export class TpeService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly requestCache = inject(RequestCacheService);
	private readonly path = `${this.configService.environment?.feePath}/tpe`;

	public getClients(): Observable<ClientCountryTpeResponse[]> {
		return this.cachedGet<ClientCountryTpeResponse[]>(`${this.path}/clients`, undefined);
	}

	public getFilters(command: TpeRangeParams): Observable<FiltersTpeResponse> {
		const params = this.buildParams(command);
		return this.cachedGet<FiltersTpeResponse>(`${this.path}/filters`, params);
	}

	public getPenaltiesOverview(command: TpeRangeIcasParams): Observable<PenaltyFeesOverviewResponse> {
		const params = this.buildParams(command);
		return this.cachedGet<PenaltyFeesOverviewResponse>(`${this.path}/penalties/overview`, params);
	}

	public getMerchantNonCompliance(command: TpeRangeIcasParams): Observable<MerchantNonComplianceResponse> {
		const params = this.buildParams(command);
		return this.cachedGet<MerchantNonComplianceResponse>(`${this.path}/merchants/non-compliance`, params);
	}

	public getMerchantNonComplianceTopMerchant(command: TpeRangeIcasParams): Observable<MerchantNonComplianceTopMerchantResponse> {
		const params = this.buildParams(command);
		return this.cachedGet<MerchantNonComplianceTopMerchantResponse>(`${this.path}/merchants/non-compliance/top-merchant`, params);
	}

	public getMerchantNonComplianceSummary(command: TpeRangeIcasParams): Observable<MerchantNonComplianceSummaryResponse> {
		const params = this.buildParams(command);
		return this.cachedGet<MerchantNonComplianceSummaryResponse>(`${this.path}/merchants/non-compliance/summary`, params);
	}

	public getMonthlyExpense(command: TpeSelectionParams): Observable<MonthlyExpenseResponse[]> {
		const params = this.buildParams(command);
		return this.cachedGet<MonthlyExpenseResponse[]>(`${this.path}/monthly-expense`, params);
	}

	public getPenaltiesByFee(command: TpeRangeIcasParams): Observable<PenaltyFeeResponse[]> {
		const params = this.buildParams(command);
		return this.cachedGet<PenaltyFeeResponse[]>(`${this.path}/penalties/fee`, params);
	}

	public getCurrentTariff(clientId: number, feeId: number): Observable<TariffDetailPopupSimpleResponse> {
		return this.cachedGet<TariffDetailPopupSimpleResponse>(`${this.path}/client/${clientId}/fee/${feeId}/tariff/current`, undefined);
	}

	public getPenaltiesByMcc(command: TpeRangeIcasParams): Observable<PenaltyMccResponse[]> {
		const params = this.buildParams(command);
		return this.cachedGet<PenaltyMccResponse[]>(`${this.path}/penalties/mcc`, params);
	}

	public getPenaltiesByMccDetails(mccId: number, command: TpeRangeIcasParams): Observable<PenaltyMccDetailResponse[]> {
		const params = this.buildParams(command);
		return this.cachedGet<PenaltyMccDetailResponse[]>(`${this.path}/penalties/mcc/${mccId}/details`, params);
	}

	public getPenaltiesByMerchantDetails(merchantId: string, command: TpeRangeIcasParams): Observable<PenaltyMerchantDetailResponse[]> {
		const params = this.buildParams(command);
		return this.cachedGet<PenaltyMerchantDetailResponse[]>(`${this.path}/penalties/merchant/${merchantId}/details`, params);
	}

	public getMerchantReport(command: TpeReportParams): Observable<PaginationResponse<MerchantReportResponse>> {
		return this.cachedQuery<PaginationResponse<MerchantReportResponse>>(`${this.path}/merchant-report`, command);
	}

	public getMerchantReportSummary(command: TpeReportParams): Observable<MerchantReportSummaryResponse> {
		return this.cachedQuery<MerchantReportSummaryResponse>(`${this.path}/merchant-report/summary`, command);
	}

	public downloadMerchantReport(command: TpeReportParams): Observable<HttpResponse<Blob>> {
		const params = this.buildParams({ clientDate: new Date() });
		return this.http.request("QUERY", `${this.path}/merchant-report/download`, {
			body: command,
			params,
			observe: "response",
			responseType: "blob",
		});
	}

	public downloadMerchantReportRawData(command: TpeReportParams): Observable<HttpResponse<Blob>> {
		const params = this.buildParams({ clientDate: new Date() });
		return this.http.request("QUERY", `${this.path}/merchant-report/download-raw-data`, {
			body: command,
			params,
			observe: "response",
			responseType: "blob",
		});
	}

	public downloadMerchantReportZip(command: TpeReportParams): Observable<HttpResponse<Blob>> {
		const params = this.buildParams({ clientDate: new Date() });
		return this.http.request("QUERY", `${this.path}/merchant-report/download-zip`, {
			body: command,
			params,
			observe: "response",
			responseType: "blob",
		});
	}

	public getRecommendations(client: number): Observable<RecommendationResponse[]> {
		const params = this.buildParams({ client });
		return this.cachedGet<RecommendationResponse[]>(`${this.path}/recommendations`, params);
	}

	public getRating(client: number, from: string): Observable<RatingResponse> {
		const params = this.buildParams({ client, from });
		return this.cachedGet<RatingResponse>(`${this.path}/rating`, params);
	}

	public sendMail(command: SendMailCommand): Observable<boolean> {
		return this.http.post<boolean>(`${this.path}/email`, command);
	}
	public requestPermissionRecomendations(): Observable<boolean> {
		return this.http.post<boolean>(`${this.path}/recommendations/request-permission`, null);
	}

	private buildParams<T extends object>(query: T): HttpParams {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
			if (value === null || value === undefined) continue;

			if (Array.isArray(value)) {
				const serialized = value
					.filter(item => item !== null && item !== undefined)
					.map(item => {
						if (item instanceof Date) return this.formatDateOnly(item);
						return this.isPrimitiveValue(item) ? String(item) : null;
					})
					.filter((item): item is string => item !== null);
				if (serialized.length === 0) continue;
				params = params.set(key, serialized.join(","));
				continue;
			}

			if (value instanceof Date) {
				params = params.set(key, this.formatDateOnly(value));
				continue;
			}

			if (this.isPrimitiveValue(value)) {
				params = params.set(key, String(value));
			}
		}

		return params;
	}

	private cachedGet<T>(url: string, params: HttpParams | undefined, ttlMs?: number): Observable<T> {
		const key = this.buildCacheKey(url, params);
		return this.requestCache.getOrSet(key, () => this.http.get<T>(url, { params }), ttlMs);
	}

	private cachedPost<T>(url: string, body: unknown, ttlMs?: number): Observable<T> {
		const key = `${url}::${JSON.stringify(body ?? {})}`;
		return this.requestCache.getOrSet(key, () => this.http.post<T>(url, body), ttlMs);
	}

	private cachedQuery<T>(url: string, body: unknown, ttlMs?: number): Observable<T> {
		const key = `${url}::${JSON.stringify(body ?? {})}`;
		return this.requestCache.getOrSet(key, () => this.http.request<T>("QUERY", url, { body }), ttlMs);
	}

	private buildCacheKey(url: string, params?: HttpParams): string {
		const paramsKey = params?.toString() ?? "";
		return `${url}::${paramsKey}`;
	}

	private formatDateOnly(value: Date): string {
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, "0");
		const day = String(value.getDate()).padStart(2, "0");
		const hours = String(value.getHours()).padStart(2, "0");
		const minutes = String(value.getMinutes()).padStart(2, "0");
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	private isPrimitiveValue(value: unknown): value is PrimitiveValue {
		const valueType = typeof value;
		return valueType === "string" || valueType === "number" || valueType === "boolean";
	}
}

type PrimitiveValue = string | number | boolean | Date;
