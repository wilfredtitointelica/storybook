import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "intelica-library-base";
import { Observable } from "rxjs";
import { UserResponse, ConfigMetadataResponse, UserUpdateCommand } from "./dto/profile-update.dto";

@Injectable({
	providedIn: "root",
})
export class ProfileService {
	private readonly http = inject(HttpClient);
	private readonly _configService = inject(ConfigService);

	getById(userId: string): Observable<UserResponse> {
		return this.http.get<UserResponse>(`${this._configService.environment?.securityPath}/User/${userId}`);
	}

	getConfigMetadata(include: string): Observable<ConfigMetadataResponse> {
		return this.http.get<ConfigMetadataResponse>(`${this._configService.environment?.securityPath}/Master/config-metadata`, {
			params: { include },
		});
	}

	update(command: UserUpdateCommand): Observable<unknown> {
		return this.http.put(`${this._configService.environment?.securityPath}/User`, command, {
			headers: { ProcessId: crypto.randomUUID() },
		});
	}
}
