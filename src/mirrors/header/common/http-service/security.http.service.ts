import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { Observable } from "rxjs";
@Injectable({
	providedIn: "root",
})
export class SecurityHttpService {
	private readonly httpClient = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	UpdateExpirationDate(accessInformationID: string): Observable<void> {
		return this.httpClient.put<void>(`${this.configService.environment?.securityPath}/AccessInformation/UpdateExpirationDate/${accessInformationID}`, "");
	}
	UpdateLastActivity(accessInformationID: string): Observable<void> {
		return this.httpClient.put<void>(`${this.configService.environment?.securityPath}/AccessInformation/UpdateLastActivity/${accessInformationID}`, "");
	}
}
