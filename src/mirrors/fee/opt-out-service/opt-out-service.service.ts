import { HttpClient, HttpResponse } from "@angular/common/http";
import { computed, inject, Injectable, Signal, signal, WritableSignal } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { QueryParametersModel } from "intelica-library-project";
import { catchError, combineLatest, distinctUntilChanged, filter, finalize, map, Observable, of, switchMap } from "rxjs";
import { OptOutServiceFilter, OptOutServiceFilterCommand, OptOutSteps, OptOutUnsubscribedDto } from "./dto/opt-out-service-commands.dto";
import { CommonGlobalService as CommonService } from "../common/services/common.service";
import {
	CardOptOutSavingsResponse,
	CardUpcomingOptOutsResponse,
	FeeByDocumentConfigurationResponse,
	GraphOptOutBillingEvolutionResponse,
	OptOutFlowResponse,
	OptOutSavingsListSummaryResponse,
	OptOutSavingsSummaryResponse,
	OptOutServicesFilterResponse,
	TopOptOutSubscriptionsCardResponse,
	TopOptOutSubscriptionsListSummaryResponse,
	TopOptOutSubscriptionsSummaryResponse,
	UpcomingOptOutsSummaryResponse,
	UpcomingSummaryResponse,
} from "./dto/opt-out-service-responses.dto";
import { PaginationResponse } from "../common/DTO/common-response";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import moment from "moment";
import { FormatDateConstants } from "../common/constants/format.date";
import { SortOrderEnum } from "../tpe/dto/tpe-responses.dto";

@Injectable({
	providedIn: "root",
})
export class OptOutServicesService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly commonService = inject(CommonService);
	private filterOptionsCache?: OptOutServicesFilterResponse;
	private readonly path = `${this.configService.environment?.feePath}/optoutservices`;

	private _pendingRequests = signal(0);
	public isApplying = computed(() => this._pendingRequests() > 0);

	public getFilters(): Observable<OptOutServicesFilterResponse> {
		return this.commonService.cachedGet<OptOutServicesFilterResponse>(`${this.path}/filters`, undefined);
	}

	public getSubscriptionsCard(command: OptOutServiceFilterCommand): Observable<TopOptOutSubscriptionsCardResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<TopOptOutSubscriptionsCardResponse>(`${this.path}/subscriptions/card`, params);
	}

	public getSavingsCard(command: OptOutServiceFilterCommand): Observable<CardOptOutSavingsResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<CardOptOutSavingsResponse>(`${this.path}/savings/card`, params);
	}

	public getUpcomingCard(command: OptOutServiceFilterCommand): Observable<CardUpcomingOptOutsResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<CardUpcomingOptOutsResponse>(`${this.path}/upcoming/card`, params);
	}

	public getBillingGraph(command: OptOutServiceFilterCommand): Observable<GraphOptOutBillingEvolutionResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<GraphOptOutBillingEvolutionResponse>(`${this.path}/billing/graph`, params);
	}

	public getSubscriptionsSummary(command: OptOutServiceFilterCommand): Observable<TopOptOutSubscriptionsSummaryResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<TopOptOutSubscriptionsSummaryResponse>(`${this.path}/subscriptions/summary`, params);
	}

	public getSavingsSummary(command: OptOutServiceFilterCommand): Observable<OptOutSavingsSummaryResponse> {
		return this.commonService.cachedQuery<OptOutSavingsSummaryResponse>(`${this.path}/savings/summary`, this.toRequestBody(command));
	}

	public getUpcomingSummary(command: OptOutServiceFilterCommand): Observable<UpcomingOptOutsSummaryResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<UpcomingOptOutsSummaryResponse>(`${this.path}/upcoming/summary`, params);
	}

	public getSubscriptionsTable(command: OptOutServiceFilterCommand): Observable<PaginationResponse<TopOptOutSubscriptionsListSummaryResponse>> {
		return this.commonService.cachedQuery<PaginationResponse<TopOptOutSubscriptionsListSummaryResponse>>(`${this.path}/subscriptions/table`, this.toRequestBody(command));
	}

	public getUpcomingTable(command: OptOutServiceFilterCommand): Observable<PaginationResponse<UpcomingSummaryResponse>> {
		return this.commonService.cachedQuery<PaginationResponse<UpcomingSummaryResponse>>(`${this.path}/upcoming/table`, this.toRequestBody(command));
	}

	public getSavingsTable(command: OptOutServiceFilterCommand): Observable<PaginationResponse<OptOutSavingsListSummaryResponse>> {
		return this.commonService.cachedQuery<PaginationResponse<OptOutSavingsListSummaryResponse>>(`${this.path}/savings/table`, this.toRequestBody(command));
	}

	public downloadSubscriptions(command: OptOutServiceFilterCommand): Observable<HttpResponse<Blob>> {
		return this.http.request("QUERY", `${this.path}/subscriptions/download`, { body: this.toRequestBody(command), observe: "response", responseType: "blob" });
	}

	public downloadSavings(command: OptOutServiceFilterCommand): Observable<HttpResponse<Blob>> {
		return this.http.request("QUERY", `${this.path}/savings/download`, { body: this.toRequestBody(command), observe: "response", responseType: "blob" });
	}

	public downloadUpcoming(command: OptOutServiceFilterCommand): Observable<HttpResponse<Blob>> {
		return this.http.request("QUERY", `${this.path}/upcoming/download`, { body: this.toRequestBody(command), observe: "response", responseType: "blob" });
	}

	private toRequestBody(command: OptOutServiceFilterCommand): Record<string, unknown> {
		return {
			...command,
			bankId: command.bankId?.length ? command.bankId.join("|") : null,
			brandId: command.brandId?.length ? command.brandId.join("|") : null,
			businessId: command.businessId?.length ? command.businessId.join("|") : null,
		};
	}

	public downloadBilling(command: OptOutServiceFilterCommand): Observable<HttpResponse<Blob>> {
		const params = this.commonService.buildParams(command);
		return this.http.get(`${this.path}/billing/download`, { params, observe: "response", responseType: "blob" });
	}

	public getUnsubscribe(command: OptOutSteps): Observable<OptOutFlowResponse> {
		const params = this.commonService.buildParams(command);
		return this.commonService.cachedGet<OptOutFlowResponse>(`${this.path}/unsubscribe`, params);
	}

	public upsertUnsubscribe(command: OptOutUnsubscribedDto): Observable<OptOutUnsubscribedDto> {
		return this.http.post<OptOutUnsubscribedDto>(`${this.path}/unsubscribe`, command);
	}

	public downloadDocument(documentId: number): Observable<HttpResponse<Blob>> {
		return this.http.get(`${this.path}/download/document/${documentId}`, { observe: "response", responseType: "blob" });
	}

	public getFeesByDocumentConfiguration(clientId: number, opcId: number): Observable<FeeByDocumentConfigurationResponse[]> {
		return this.commonService.cachedGet<FeeByDocumentConfigurationResponse[]>(`${this.path}/upcoming/fees/client/${clientId}/document-configuration/${opcId}`, undefined);
	}

	//Signals
	public buildCardSignal<T>(
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
					let command = this.mapToCommand(f, this.filterOptionsCache);
					if (commandOverride) {
						command = commandOverride(command);
					}

					const commandWithRefresh = {
						...command,
						__refresh: r,
					} as OptOutServiceFilterCommand;

					const key = [
						r,
						(command.bankId ?? []).slice().sort().join(","),
						(command.brandId ?? []).slice().sort().join(","),
						(command.businessId ?? []).slice().sort().join(","),
						command.startDate,
						command.endDate,
					].join("|");

					return { command: commandWithRefresh, key };
				}),
				distinctUntilChanged((a, b) => a.key === b.key),
				switchMap(({ command }) => {
					loadingSignal.set(true);
					this._pendingRequests.update(n => n + 1);

					return loader(command).pipe(
						catchError(() => of(null)),
						finalize(() => {
							loadingSignal.set(false);
							this._pendingRequests.update(n => Math.max(0, n - 1));
						})
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

	public buildTableSignal<T>(
		loader: (cmd: OptOutServiceFilterCommand) => Observable<T>,
		loadingSignal: WritableSignal<boolean>,
		filterSignal: Signal<OptOutServiceFilter>,
		queryParamsSignal: Signal<QueryParametersModel>,
		commandOverride?: (base: OptOutServiceFilterCommand) => OptOutServiceFilterCommand,
		refreshSignal?: Signal<number>
	) {
		let lastFilter: OptOutServiceFilter | null = null;
		const refresh = refreshSignal ? toObservable(refreshSignal) : of(0);
		return toSignal<T | null>(
			combineLatest([toObservable(filterSignal), toObservable(queryParamsSignal), refresh]).pipe(
				filter(([f]) => f.brandId.length > 0 || f.businessId.length > 0),
				map(([f, queryParams, r]) => {
					const filterChanged = lastFilter !== null && JSON.stringify(f) !== JSON.stringify(lastFilter);
					lastFilter = f;
					let command = this.mapToCommand(f, this.filterOptionsCache);
					if (commandOverride) {
						command = commandOverride(command);
					} else {
						command.pageNumber = filterChanged ? 1 : (queryParams.PageNumber ?? 1);
						command.pageSize = queryParams.PageSize ?? 10;
						command.sortField = queryParams.OrderBy ?? "";
						command.sortOrder = queryParams.SortDirection === "asc" ? SortOrderEnum.Ascending : SortOrderEnum.Descending;
						command.searchText = queryParams.FilterValue ?? "";
					}

					const commandWithRefresh = {
						...command,
						__refresh: r,
					} as OptOutServiceFilterCommand;

					const key = [
						r,
						(command.bankId ?? []).slice().sort().join(","),
						(command.brandId ?? []).slice().sort().join(","),
						(command.businessId ?? []).slice().sort().join(","),
						command.startDate,
						command.endDate,
						command.pageNumber,
						command.pageSize,
						command.sortField,
						command.sortOrder,
						command.searchText,
					].join("|");
					return { command: commandWithRefresh, key };
				}),
				distinctUntilChanged((a, b) => a.key === b.key),
				switchMap(({ command }) => {
					loadingSignal.set(true);
					this._pendingRequests.update(n => n + 1);
					return loader(command).pipe(
						catchError(() => of(null)),
						finalize(() => {
							loadingSignal.set(false);
							this._pendingRequests.update(n => Math.max(0, n - 1));
						})
					);
				})
			),
			{ initialValue: null }
		);
	}

	public buildEntitySignal<TCommand, TResponse>(commandSignal: Signal<TCommand | null>, loader: (command: TCommand) => Observable<TResponse>, loadingSignal: WritableSignal<boolean>) {
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

	private mapToCommand(filter: OptOutServiceFilter, options?: OptOutServicesFilterResponse): OptOutServiceFilterCommand {
		const [from, to] = filter.dates ?? [];

		const allBankIds = options?.clients?.map(x => x.bankId) ?? [];
		const allBrandIds = options?.brands?.map(x => x.id) ?? [];
		const allBusinessIds = options?.business?.map(x => x.id) ?? [];

		return new OptOutServiceFilterCommand({
			bankId: this.normalizeIds(filter.bankId, allBankIds),
			brandId: this.normalizeIds(filter.brandId, allBrandIds),
			businessId: this.normalizeIds(filter.businessId, allBusinessIds),
			startDate: from ? moment(from).format(FormatDateConstants.YYYYMMDD) : "",
			endDate: to ? moment(to).format(FormatDateConstants.YYYYMMDD) : "",
			pageNumber: 1,
			pageSize: 10,
		});
	}

	private normalizeIds(selected: number[] = [], all: number[] = []): number[] {
		return selected;
	}

	public downloadFile(fileName: string, blob: any): void {
		const nav = window.navigator as any;
		if (nav.msSaveOrOpenBlob) {
			nav.msSaveOrOpenBlob(blob, fileName);
		} else {
			const link = document.createElement("a");
			link.setAttribute("type", "hidden");
			link.download = fileName;
			link.href = window.URL.createObjectURL(blob.body);
			document.body.appendChild(link);
			link.click();
		}
	}

	public viewFile(fileName: string, response: { body: Blob }) {
		//para que el blob viva en la nueva pestaña y se libere la memoria automaticamente cuando se cierre
		const blob = response.body;
		const newTab = window.open("", "_blank");
		if (!newTab) return;
		newTab.document.title = fileName;
		const doc = newTab.document;
		const script = doc.createElement("script");
		script.type = "text/javascript";
		script.textContent = `
    (function() {
      function handleMessage(e) {
        if (!(e.data instanceof Blob)) return;
        const url = URL.createObjectURL(e.data);
        const embed = document.createElement('embed');
        embed.src = url;
        embed.type = e.data.type;
        embed.style.width = '100%';
        embed.style.height = '100%';
        document.body.appendChild(embed);
        window.removeEventListener('message', handleMessage);
		  document.querySelectorAll("script").forEach(s => s.remove());
      }
      window.addEventListener('message', handleMessage);
    })();
  `;
		doc.body.appendChild(script);
		newTab.postMessage(blob, "*");
	}

	public getFileNameFromHeader(response: HttpResponse<Blob>): string | null {
		const disposition = response.headers.get("content-disposition");
		if (!disposition) return null;

		// RFC 5987 (UTF-8)
		const utf8 = disposition.match(/filename\*\=UTF-8''(.+)/);
		if (utf8?.[1]) return decodeURIComponent(utf8[1]);

		// fallback clásico
		const normal = disposition.match(/filename="?([^"]+)"?/);
		return normal?.[1] ?? null;
	}

	public setFilterOptions(options: OptOutServicesFilterResponse) {
		this.filterOptionsCache = options;
	}
}
