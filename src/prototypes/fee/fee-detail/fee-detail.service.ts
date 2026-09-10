import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, forkJoin, map } from "rxjs";
import { ConfigService } from "intelica-library-base";
import { RequestCacheService } from "intelica-library-project";
import {
	BillingHistoryItem,
	BillingHistoryResponse,
	FeeDetailChartItem,
	FeeDetailKpiResponse,
	FeeDetailInfoResponse,
	FeeRateVersionsResponse,
	FeeReferenceItem,
	FeeSummaryResponse,
} from "./dto/fee-detail.dto";
import { FeeDetailChartQuery, FeeDetailHistoryQuery, FeeDetailKpiQuery } from "./dto/fee-detail-commands.dto";
import {
	FeeDetailChartItemSimpleResponse,
	FeeDetailDatesSimpleResponse,
	FeeDetailSimpleResponse,
	FeeFileDocumentSimpleResponse,
	FeeHistorySimpleResponse,
	FeeHistoryTotalSimpleResponse,
	PaginationSimpleResponse,
} from "./dto/fee-detail-responses.dto";
import { DatePeriodEnum, RateStructureEnum } from "./common/enums";

@Injectable({ providedIn: "root" })
export class FeeDetailService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly requestCache = inject(RequestCacheService);
	private readonly path = `${this.configService.environment?.feePath}/FeeDetail`;

	public getFeeDetailInfo(feeId: string, bankId: number): Observable<FeeDetailInfoResponse> {
		return forkJoin({
			info: this.http.get<FeeDetailSimpleResponse>(`${this.path}/GetFeeDetail/${feeId}`),
			dates: this.http.get<FeeDetailDatesSimpleResponse>(`${this.path}/GetFeeDetailDates/${feeId}/${bankId}`),
		}).pipe(map(({ info, dates }) => this.toFeeDetailInfo(info, dates)));
	}

	public getFeeSummary(feeId: string, bankId: number): Observable<FeeSummaryResponse> {
		return this.http.get<FeeSummaryResponse>(`${this.path}/GetFeeSummary/${feeId}/${bankId}`);
	}

	public getFeeRateVersions(feeId: string, bankId: number): Observable<FeeRateVersionsResponse> {
		return this.http.get<FeeRateVersionsResponse>(`${this.path}/GetFeeRateVersions/${feeId}/${bankId}`);
	}

	public getFeeDetailKpi(query: FeeDetailKpiQuery): Observable<FeeDetailKpiResponse> {
		const previousRange = this.computeKpiPreviousRange(query);
		const currentRequest = this.fetchHistoryTotal(query);

		if (!previousRange) {
			return currentRequest.pipe(map(current => this.toFeeDetailKpi(current, null)));
		}

		const previousRequest = this.fetchHistoryTotal({
			...query,
			startDate: previousRange.startDate,
			endDate: previousRange.endDate,
		});

		return forkJoin({ current: currentRequest, previous: previousRequest }).pipe(map(({ current, previous }) => this.toFeeDetailKpi(current, previous)));
	}

	private computeKpiPreviousRange(query: FeeDetailKpiQuery): { startDate: string; endDate: string } | null {
		const months = this.monthsBetween(query.startDate, query.endDate);
		if (months > 12) return null;
		if (query.period === DatePeriodEnum.CurrentMonth || this.rangeMatchesCurrentMonth(query.startDate, query.endDate)) {
			return this.previousCalendarMonthRange(query.startDate);
		}
		return {
			startDate: this.shiftIsoByMonths(query.startDate, -12),
			endDate: this.shiftIsoByMonths(query.endDate, -12),
		};
	}

	private rangeMatchesCurrentMonth(startIso: string, endIso: string): boolean {
		const [sy, sm, sd] = startIso.split("-").map(Number);
		const [ey, em, ed] = endIso.split("-").map(Number);
		if (!sy || !sm || !sd || !ey || !em || !ed) return false;
		const today = new Date();
		if (sy !== today.getFullYear() || sm !== today.getMonth() + 1 || sd !== 1) return false;
		if (ey !== today.getFullYear() || em !== today.getMonth() + 1 || ed !== today.getDate()) return false;
		return true;
	}

	private previousCalendarMonthRange(currentStartIso: string): { startDate: string; endDate: string } {
		const [y, m] = currentStartIso.split("-").map(Number);
		const prev = new Date(y, m - 2, 1);
		const prevYear = prev.getFullYear();
		const prevMonth = prev.getMonth();
		const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
		const pad = (n: number) => String(n).padStart(2, "0");
		return {
			startDate: `${prevYear}-${pad(prevMonth + 1)}-01`,
			endDate: `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDay)}`,
		};
	}

	private monthsBetween(startIso: string, endIso: string): number {
		const [sy, sm] = startIso.split("-").map(Number);
		const [ey, em] = endIso.split("-").map(Number);
		if (!sy || !sm || !ey || !em) return 0;
		return (ey - sy) * 12 + (em - sm) + 1;
	}

	private shiftIsoByMonths(iso: string, monthOffset: number): string {
		if (!iso) return iso;
		const [y, m, d] = iso.split("-").map(Number);
		if (!y || !m || !d) return iso;
		const date = new Date(y, m - 1 + monthOffset, d);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
	}

	public getFeeDetailChart(query: FeeDetailChartQuery): Observable<FeeDetailChartItem[]> {
		const params = this.buildParams({
			feeId: query.feeId,
			bankId: query.bankId,
			startDate: query.startDate,
			endDate: query.endDate,
			period: query.period,
		});
		return this.cachedGet<FeeDetailChartItemSimpleResponse[]>(`${this.path}/GetFeeDetailChart`, params).pipe(
			map(items =>
				items.map(i => ({
					year: i.year,
					month: i.month,
					amount: i.amount,
					previousYearAmount: i.previousYearAmount,
					events: i.events,
				}))
			)
		);
	}

	public getFeeDetailHistory(query: FeeDetailHistoryQuery): Observable<BillingHistoryResponse> {
		const params = this.buildHistoryParams(query);
		return this.cachedGet<PaginationSimpleResponse<FeeHistorySimpleResponse>>(`${this.path}/ListFeeHistory`, params).pipe(map(result => this.toBillingHistoryResponse(result)));
	}

	public getReferences(feeId: string): Observable<FeeReferenceItem[]> {
		return this.cachedGet<FeeFileDocumentSimpleResponse[]>(`${this.path}/ListFilesByFee/${feeId}`).pipe(map(items => (items ?? []).map(i => this.toFeeReferenceItem(i))));
	}

	public downloadReferencePdf(filePath: string): Observable<Blob> {
		const params = new HttpParams().set("filePath", filePath);
		return this.http.get(`${this.path}/DownloadFileDocument`, { params, responseType: "blob" });
	}

	public downloadBillingHistory(query: FeeDetailHistoryQuery): Observable<HttpResponse<Blob>> {
		const params = this.buildDownloadParams(query);
		return this.http.get(`${this.path}/ExportFeeHistoryReport`, {
			params,
			observe: "response",
			responseType: "blob",
		});
	}

	public downloadExpenseEvolutionComparison(feeId: string, bankId: number, startDate: string, endDate: string): Observable<HttpResponse<Blob>> {
		const params = this.buildParams({ FeeId: feeId, BankId: bankId, StartDate: startDate, EndDate: endDate });
		return this.http.get(`${this.path}/ExportExpenseEvolutionComparisonReport`, {
			params,
			observe: "response",
			responseType: "blob",
		});
	}

	private fetchHistoryTotal(query: FeeDetailKpiQuery): Observable<FeeHistoryTotalSimpleResponse> {
		const params = this.buildParams({
			FeeId: query.feeId,
			BankId: query.bankId !== -1 ? String(query.bankId) : "",
			StartDate: query.startDate,
			EndDate: query.endDate,
			PageSize: 1,
		});
		return this.cachedGet<FeeHistoryTotalSimpleResponse>(`${this.path}/GetFeeHistoryTotal`, params);
	}

	private toFeeDetailKpi(current: FeeHistoryTotalSimpleResponse, previous: FeeHistoryTotalSimpleResponse | null): FeeDetailKpiResponse {
		const sumCurrent = (current.feeAmountTotalByCurrency ?? []).reduce((acc, c) => acc + (c.feeAmountTotal ?? 0), 0);
		const primaryCurrency = (current.feeAmountTotalByCurrency ?? []).slice().sort((a, b) => (b.feeAmountTotal ?? 0) - (a.feeAmountTotal ?? 0))[0]?.billingCurrencyGroup ?? "";
		const hasCurrentData = (current.feeAmountTotalByCurrency?.length ?? 0) > 0;

		const hasPreviousData = previous !== null && (previous.feeAmountTotalByCurrency?.length ?? 0) > 0;
		const sumPrevious = hasPreviousData ? (previous!.feeAmountTotalByCurrency ?? []).reduce((acc, c) => acc + (c.feeAmountTotal ?? 0), 0) : null;

		return {
			totalFeeAmount: hasCurrentData ? sumCurrent : 0,
			currency: primaryCurrency,
			totalEvents: hasCurrentData ? current.feeCntTotal : null,
			totalFeeAmountPrevious: sumPrevious,
			hasEnoughHistory: hasPreviousData,
			isSinglePeriod: false,
			hasIncompleteHistory: false,
		};
	}

	private toBillingHistoryResponse(r: PaginationSimpleResponse<FeeHistorySimpleResponse>): BillingHistoryResponse {
		const items: BillingHistoryItem[] = (r.items ?? []).map(i => this.toBillingHistoryItem(i));
		const originals = new Set(items.map(i => i.originalCurrency).filter(c => !!c));
		const hasMultipleCurrencies = originals.size > 1 || items.some(i => !!i.originalCurrency && !!i.targetCurrency && i.originalCurrency !== i.targetCurrency);
		const unifiedCurrency = items.find(i => !!i.targetCurrency)?.targetCurrency ?? "";

		return {
			items,
			totalCount: r.totalCount ?? items.length,
			hasMultipleCurrencies,
			unifiedCurrency,
		};
	}

	private toFeeReferenceItem(r: FeeFileDocumentSimpleResponse): FeeReferenceItem {
		return {
			documentId: r.documentId,
			fileName: r.fileName ?? r.description ?? "",
			documentCode: r.documentCode ?? "",
			documentType: r.fileType ?? "",
			documentCategory: r.fileType ?? "",
			publicationDate: this.formatPublicationDate(r.publicationDate),
			path: r.path ?? "",
		};
	}

	private formatPublicationDate(iso: string | null): string {
		if (!iso) return "";
		const date = new Date(iso);
		if (isNaN(date.getTime())) return "";
		const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
		const day = String(date.getDate()).padStart(2, "0");
		const month = months[date.getMonth()];
		const year = date.getFullYear();
		return `${day} ${month}, ${year}`;
	}

	private toBillingHistoryItem(r: FeeHistorySimpleResponse): BillingHistoryItem {
		return {
			date: r.runDt,
			billingNumber: r.invoiceNumDesc,
			billingActivity: r.billingActivity ?? "",
			entityActivity: r.entityActivity ?? "",
			description: r.feeDesc ?? "",
			price: r.feeRate,
			events: r.feeCnt,
			originalCurrency: r.originalCurrency ?? "",
			originalAmount: r.originalAmount,
			exchangeRate: r.exchangeRate,
			targetCurrency: r.targetCurrency ?? "",
			targetAmount: r.targetAmount,
			isUnallocated: r.isUnallocated ?? false,
		};
	}

	private buildHistoryParams(query: FeeDetailHistoryQuery): HttpParams {
		return this.buildParams({
			FeeId: query.feeId,
			BankId: query.bankId !== -1 ? String(query.bankId) : "",
			StartDate: query.startDate,
			EndDate: query.endDate,
			PageSize: 0,
		});
	}

	private buildDownloadParams(query: FeeDetailHistoryQuery): HttpParams {
		return this.buildParams({
			FeeId: query.feeId,
			BrandId: query.brandId,
			BankId: query.bankId !== -1 ? String(query.bankId) : "",
			StartDate: query.startDate,
			EndDate: query.endDate,
			TypePeriod: 7,
			SortField: query.sortField,
			SortOrder: query.sortOrder,
		});
	}

	private cachedGet<T>(url: string, params?: HttpParams): Observable<T> {
		const key = `${url}::${params?.toString() ?? ""}`;
		return this.requestCache.getOrSet(key, () => this.http.get<T>(url, { params }));
	}

	private buildParams<T extends object>(query: T): HttpParams {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
			if (value === null || value === undefined || value === "") continue;
			if (Array.isArray(value)) {
				const s = value.filter(v => v !== null && v !== undefined && v !== "").map(v => String(v));
				if (s.length) params = params.set(key, s.join(","));
			} else if (typeof value !== "object") {
				params = params.set(key, String(value));
			}
		}
		return params;
	}

	private toFeeDetailInfo(r: FeeDetailSimpleResponse, d: FeeDetailDatesSimpleResponse): FeeDetailInfoResponse {
		return {
			feeId: String(r.feeId),
			feeName: r.feeName ?? "",
			brandId: r.brandId ?? 0,
			brand: r.brandDesc ?? "",
			businessId: r.memberChargedId ?? 0,
			business: r.memberChargedDescription ?? "",
			feeOCode: r.feeOCode ?? "",
			feeCode: r.feeCode ?? "",
			description: r.feeDescription ?? "",
			currentRate: "",
			billingFrequency: "",
			rateStructure: RateStructureEnum.NotAvailable,
			rateVersions: [],
			additionalDetails: {
				scope: [],
				transactionTypes: [],
				productTypes: [],
				associatedFees: [],
				isAssociated: false,
				isDependent: false,
				isMultipleRate: false,
			},
			minDate: d.minDate ?? "",
			maxDate: d.maxDate ?? "",
			isSinglePeriod: !!d.minDate && d.minDate === d.maxDate,
			hasAlert: false,
			associatedBanks: (d.associatedBanks ?? []).map(b => ({ bankId: b.id, bankName: b.name })),
			referencesCount: d.referencesCount ?? 0,
		};
	}
}
