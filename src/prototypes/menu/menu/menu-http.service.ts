import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { Observable } from "rxjs/internal/Observable";
import { MenuOptionResponse } from "./dto/menu-responses";

@Injectable({
	providedIn: "root",
})
export class MenuHttpService {
	private readonly HttpClient = inject(HttpClient);
	private readonly ConfigService = inject(ConfigService);
	private readonly path = `${this.ConfigService.environment?.securityPath}/menu`;

	getAllMenuOption(menuOptionId: string): Observable<MenuOptionResponse[]> {
		return this.HttpClient.get<MenuOptionResponse[]>(`${this.path}/sub-menu/${menuOptionId}`);
	}

	getURLPortal(): Observable<string> {
		return this.HttpClient.get<string>(`${this.path}/GetURLPortal`);
	}
}
