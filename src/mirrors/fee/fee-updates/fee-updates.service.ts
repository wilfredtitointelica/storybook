import { HttpClient, HttpResponse } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ConfigService } from "intelica-library-base";
import { FeeUpdatesExportCommand, FeeUpdatesSummaryQuery, FeeUpdatesTableQuery } from "./dto/fee-updates-commands.dto";
import { CeasedFeesResponse, FeeUpdatesFiltersBootstrapResponse, FeeUpdatesSummaryResponse, NewFeesResponse, TariffChangesResponse } from "./dto/fee-updates-responses.dto";
import { CommonGlobalService } from "../common/services/common.service";

@Injectable({ providedIn: "root" })
export class FeeUpdatesService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly commonGlobalService = inject(CommonGlobalService);
	private readonly path = `${this.configService.environment?.feePath}/FeeUpdates`;

	public getFiltersBootstrap(): Observable<FeeUpdatesFiltersBootstrapResponse> {
		return this.commonGlobalService.cachedGet<FeeUpdatesFiltersBootstrapResponse>(`${this.path}/GetFiltersBootstrap`, undefined);
	}

	public getSummary(query: FeeUpdatesSummaryQuery): Observable<FeeUpdatesSummaryResponse> {
		return this.commonGlobalService.cachedGet<FeeUpdatesSummaryResponse>(`${this.path}/GetSummary`, this.commonGlobalService.buildParams(query));
	}

	public getNewFees(query: FeeUpdatesTableQuery): Observable<NewFeesResponse> {
		return this.commonGlobalService.cachedQuery<NewFeesResponse>(`${this.path}/ListNewFees`, this.toRequestBody(query));
	}

	public getTariffChanges(query: FeeUpdatesTableQuery): Observable<TariffChangesResponse> {
		return this.commonGlobalService.cachedQuery<TariffChangesResponse>(`${this.path}/ListTariffChanges`, this.toRequestBody(query));
	}

	public getCeasedFees(query: FeeUpdatesTableQuery): Observable<CeasedFeesResponse> {
		return this.commonGlobalService.cachedQuery<CeasedFeesResponse>(`${this.path}/ListCeasedFees`, this.toRequestBody(query));
	}

	public exportTab(command: FeeUpdatesExportCommand): Observable<HttpResponse<Blob>> {
		return this.http.request("QUERY", `${this.path}/ExportTab`, {
			body: this.toRequestBody(command),
			observe: "response",
			responseType: "blob",
		});
	}

	private toRequestBody(query: { entityIds: number[]; brandIds: number[]; businessIds: number[] }): Record<string, unknown> {
		return {
			...query,
			entityIds: query.entityIds?.length ? query.entityIds.join("|") : null,
			brandIds: query.brandIds?.length ? query.brandIds.join("|") : null,
			businessIds: query.businessIds?.length ? query.businessIds.join("|") : null,
		};
	}
}
