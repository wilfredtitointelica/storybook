import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "intelica-library-base";
import { Observable } from "rxjs";
import { SecurityStatusResponse } from "./dto/password-update.dto";
import { SetupTwoFactorResponse, VerifyTwoFactorResponse } from "./dto/two-factor.dto";
import { SessionService } from "../../common/session/session.service";

@Injectable({
	providedIn: "root",
})
export class SecurityService {
	private readonly http = inject(HttpClient);
	private readonly _configService = inject(ConfigService);
	private readonly session = inject(SessionService);

	getSecurityStatus(businessUserID: string): Observable<SecurityStatusResponse> {
		return this.http.get<SecurityStatusResponse>(`${this._configService.environment?.securityPath}/User/${businessUserID}/status`);
	}

	setupTwoFactor(businessUserID: string): Observable<SetupTwoFactorResponse> {
		return this.http.post<SetupTwoFactorResponse>(`${this._configService.environment?.securityPath}/User/two-factor/${businessUserID}`, {});
	}

	verifyTwoFactor(businessUserID: string, code: string): Observable<VerifyTwoFactorResponse> {
		return this.http.post<VerifyTwoFactorResponse>(`${this._configService.environment?.securityPath}/User/two-factor/${businessUserID}/verify`, { code });
	}

	changePassword(currentPassword: string, newPassword: string): Observable<void> {
		return this.http.put<void>(`${this._configService.environment?.securityPath}/User/password`, { businessUserID: this.session.businessUserID(), currentPassword, newPassword });
	}
}
