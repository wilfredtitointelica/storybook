import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigService } from "intelica-library-base";
import { map, Observable } from "rxjs";
import { AddMemberResponse, BusinessWorkDto, TeamMembersResponse } from "./dto/member.dto";
import { SessionService } from "../../common/session/session.service";

@Injectable({
	providedIn: "root",
})
export class TeamsService {
	private readonly http = inject(HttpClient);
	private readonly _configService = inject(ConfigService);
	private readonly session = inject(SessionService);

	getBusinessWorks(): Observable<BusinessWorkDto[]> {
		return this.http
			.get<{ businessWorks: BusinessWorkDto[] }>(`${this._configService.environment?.securityPath}/Master/config-metadata`, {
				params: { include: "businessworks" },
			})
			.pipe(map(r => r.businessWorks ?? []));
	}

	addMember(data: { name: string; lastName: string; email: string; isAdmin: boolean; businessWorkId: string | null; businessWorkOther?: string; clientGroupID: string }): Observable<AddMemberResponse> {
		return this.http.post<AddMemberResponse>(
			`${this._configService.environment?.securityPath}/User`,
			{
				businessUserTypeID: null,
				adminBusinessUserID: this.session.businessUserID(),
				businessUserStatusID: null,
				businessUserStatusCode: "A",
				countryID: null,
				name: data.name,
				lastName: data.lastName,
				email: data.email,
				userLoginID: data.email,
				expirationDate: null,
				isAdmin: data.isAdmin,
				userClientGroups: [{ clientGroupID: data.clientGroupID, isDefault: true, userClientGroupDetailsSelected: [] }],
				workRoleId: null,
				businessWorkOther: data.businessWorkOther ?? null,
				businessWorkId: data.businessWorkId,
				department: null,
			},
			{
				headers: { ProcessId: crypto.randomUUID() },
			}
		);
	}

	updateMember(data: {
		userID: string;
		userLoginID: string;
		name: string;
		lastName: string;
		email: string;
		isAdmin: boolean;
		businessWorkId: string | null;
		businessWorkOther?: string;
	}): Observable<unknown> {
		return this.http.put(
			`${this._configService.environment?.securityPath}/User`,
			{
				userID: data.userID,
				areaID: null,
				businessUserTypeID: null,
				businessUserStatusID: null,
				countryID: null,
				name: data.name,
				lastName: data.lastName,
				email: data.email,
				userLoginID: data.userLoginID || data.email,
				expirationDate: null,
				isAdmin: data.isAdmin,
				workRoleId: null,
				businessWorkOther: data.businessWorkOther ?? null,
				businessWorkId: data.businessWorkId,
				department: null,
			},
			{
				headers: { ProcessId: crypto.randomUUID() },
			}
		);
	}

	deleteMember(businessUserID: string): Observable<unknown> {
		return this.http.delete(`${this._configService.environment?.securityPath}/User/${businessUserID}`, {
			headers: { ProcessId: crypto.randomUUID() },
		});
	}

	resolveRequest(businessUserID: string, action: "APPROVE" | "REJECT"): Observable<unknown> {
		return this.http.post(`${this._configService.environment?.securityPath}/User/requests`, {
			adminBusinessUserID: this.session.businessUserID(),
			businessUserID,
			action,
		});
	}

	listTeamMembers(): Observable<TeamMembersResponse[]> {
		return this.http.post<TeamMembersResponse[]>(`${this._configService.environment?.securityPath}/User/members`, {
			businessUserID: this.session.businessUserID(),
			clientGroupID: this.session.clientGroupID(),
		});
	}
}
