import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { Observable } from "rxjs";
import { ClientInformationResponse } from "../../common/DTO/client-response";
import { CustomConfigurationConstants } from "./common/constants";
import { CustomConfigurationMaintenanceRequest } from "./DTO/request";
import { CustomConfigurationByFeeResponse, CustomConfigurationMaintenanceResponse } from "./DTO/response";

@Injectable({ providedIn: "root" })
export class CustomConfigurationService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);

	private get baseUrl(): string {
		return `${this.configService.environment?.feePath}/${CustomConfigurationConstants.BASE_URL}`;
	}

	private get clientInfoUrl(): string {
		return `${this.configService.environment?.feePath}/FeeLibrary/ClientInformation`;
	}

	getClientInformation(): Observable<ClientInformationResponse> {
		return this.http.get<ClientInformationResponse>(this.clientInfoUrl);
	}

	private bankIdParams(bankId: number): HttpParams {
		return new HttpParams().set("bankId", String(bankId));
	}

	getByFee(feeId: number, bankId: number): Observable<CustomConfigurationByFeeResponse> {
		return this.http.get<CustomConfigurationByFeeResponse>(`${this.baseUrl}/${CustomConfigurationConstants.GET_BY_FEE}/${feeId}`, { params: this.bankIdParams(bankId) });
	}

	create(command: CustomConfigurationMaintenanceRequest, bankId: number): Observable<CustomConfigurationMaintenanceResponse> {
		return this.http.post<CustomConfigurationMaintenanceResponse>(this.baseUrl, { ...command, bankId });
	}

	update(id: number, command: CustomConfigurationMaintenanceRequest, bankId: number): Observable<CustomConfigurationMaintenanceResponse> {
		return this.http.put<CustomConfigurationMaintenanceResponse>(`${this.baseUrl}/${id}`, { ...command, bankId });
	}

	delete(id: number, bankId: number): Observable<CustomConfigurationMaintenanceResponse> {
		return this.http.delete<CustomConfigurationMaintenanceResponse>(`${this.baseUrl}/${id}`, { params: this.bankIdParams(bankId) });
	}
}
