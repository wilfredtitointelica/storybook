import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { Observable, of } from "rxjs";
import { BrandLastUpdateResponse } from "./dto/status-last-update-responses";

@Injectable({
	providedIn: "root",
})
export class StatusLastUpdateHttpService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly path = `${this.configService.environment?.feePath}/brand`;

	public getLastBrandUpdates(): Observable<BrandLastUpdateResponse[]> {
		return this.http.get<BrandLastUpdateResponse[]>(`${this.path}/last-update`);
	}
}
