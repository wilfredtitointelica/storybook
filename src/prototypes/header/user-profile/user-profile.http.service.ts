import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AuthenticationResponse, ConfigService } from "intelica-library-base";
import { AuthenticationProfileCommand, BusinessUserClientGroupsResponse } from "./dto/profile.dto";
@Injectable({
	providedIn: "root",
})
export class UserProfileHttpService {
	constructor() {}
	private readonly httpClient = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	validateAuthentication(authenticationCommand: AuthenticationProfileCommand): Observable<AuthenticationResponse> {
		return this.httpClient.post<AuthenticationResponse>(`${this.configService.environment?.authenticationPath}/ignore/change-profile`, authenticationCommand);
	}
	getClientGroupsByUser(): Observable<BusinessUserClientGroupsResponse[]> {
		return this.httpClient.get<BusinessUserClientGroupsResponse[]>(`${this.configService.environment?.securityPath}/BusinessUser/clientGroupsByUser`);
	}
}
