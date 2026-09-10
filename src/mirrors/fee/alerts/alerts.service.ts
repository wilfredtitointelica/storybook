import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { RequestCacheService } from "intelica-library-project";
import { Observable, tap } from "rxjs";
import { AlertDetailQueryParams, AlertExportParams, AlertsQueryParams, MarkAsReadCommand, MarkAsViewedCommand } from "./dto/alerts-commands.dto";
import { AlertGroupDetailResponse, AlertsListResponse } from "./dto/alerts-responses.dto";
import { ClientInformationResponse } from "../common/DTO/client-response";
import { CommonGlobalService } from "../common/services/common.service";

@Injectable({
	providedIn: "root",
})
export class AlertsService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly requestCache = inject(RequestCacheService);
	private readonly commonGlobalService = inject(CommonGlobalService);
	private readonly path = `${this.configService.environment?.feePath}/system-alerts`;
	private readonly clientInfoUrl = `${this.configService.environment?.feePath}/FeeLibrary/ClientInformation`;

	// Bumped after a successful mark-as-read so all alert lists re-fetch
	private readonly _refreshTrigger = signal(0);
	readonly refreshTrigger = this._refreshTrigger.asReadonly();

	getAlerts(params: AlertsQueryParams): Observable<AlertsListResponse> {
		return this.cachedQuery<AlertsListResponse>(`${this.path}/alerts`, params);
	}

	getAlertDetail(params: AlertDetailQueryParams): Observable<AlertGroupDetailResponse> {
		const httpParams = this.buildParams(params);
		return this.cachedGet<AlertGroupDetailResponse>(`${this.path}/alerts/detail`, httpParams);
	}

	getClientInformation(): Observable<ClientInformationResponse> {
		return this.cachedGet<ClientInformationResponse>(this.clientInfoUrl, new HttpParams());
	}

	markAsRead(command: MarkAsReadCommand): Observable<void> {
		return this.http.put<void>(`${this.path}/alerts/mark-read`, command).pipe(
			tap(() => {
				this.requestCache.invalidate(`${this.path}/alerts`);
				this._refreshTrigger.update(v => v + 1);
			})
		);
	}

	markAsViewed(command: MarkAsViewedCommand): Observable<void> {
		return this.http.put<void>(`${this.path}/alerts/mark-viewed`, command);
	}

	exportAlerts(filter: AlertExportParams): Observable<HttpResponse<Blob>> {
		return this.http.request("QUERY", `${this.path}/alerts/export`, {
			body: filter,
			observe: "response",
			responseType: "blob",
		});
	}

	private buildParams<T extends object>(query: T): HttpParams {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
			if (value === null || value === undefined || value === "") continue;
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				params = params.set(key, String(value));
			}
			if (Array.isArray(value)) {
				value.forEach(value => {
					params = params.append(key, String(value));
				});
			}
		}
		return params;
	}

	private cachedGet<T>(url: string, params: HttpParams): Observable<T> {
		const key = `${url}::${params.toString()}`;
		return this.requestCache.getOrSet(key, () => this.http.get<T>(url, { params }));
	}

	private cachedQuery<T>(url: string, body: unknown): Observable<T> {
		const key = `${url}::${JSON.stringify(body ?? {})}`;
		return this.requestCache.getOrSet(key, () => this.http.request<T>("QUERY", url, { body }));
	}
}
