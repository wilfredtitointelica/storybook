import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { map, Observable } from "rxjs";
import { SearchCommand, SearchRecentCreateCommand, SearchType } from "./dto/search-commands";
import { SearchResultItemResponse, SearchSectionResponse } from "./dto/search-responses";

@Injectable({
	providedIn: "root",
})
export class SearchHttpService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	private readonly path = `${this.configService.environment?.feePath}/search`;

	public search(command: SearchCommand): Observable<SearchResultItemResponse[]> {
		const params = new HttpParams().set("type", command.type).set("q", command.text);
		return this.http.get<SearchResultItemResponse[]>(`${this.path}`, { params }).pipe(map(results => results.map<SearchResultItemResponse>(r => ({ ...r, type: r.type.toLowerCase() as SearchType }))));
	}

	public getTopFees(): Observable<SearchResultItemResponse[]> {
		return this.http.get<SearchResultItemResponse[]>(`${this.path}/fees/top`).pipe(map(results => results.map<SearchResultItemResponse>(r => ({ ...r, type: r.type.toLowerCase() as SearchType }))));
	}

	public getRecentSearches(limit: number = 20): Observable<SearchResultItemResponse[]> {
		const params = new HttpParams().set("limit", limit);
		return this.http
			.get<SearchResultItemResponse[]>(`${this.path}/recent`, { params })
			.pipe(map(results => results.map<SearchResultItemResponse>(r => ({ ...r, type: r.type.toLowerCase() as SearchType }))));
	}

	public saveRecentSearch(command: SearchRecentCreateCommand): Observable<void> {
		return this.http.post<void>(`${this.path}/recent`, command);
	}

	public getFavorites(type: SearchType): Observable<SearchResultItemResponse[]> {
		const params = new HttpParams().set("type", type);
		return this.http
			.get<SearchResultItemResponse[]>(`${this.path}/favorites`, { params })
			.pipe(map(results => results.map<SearchResultItemResponse>(r => ({ ...r, type: r.type.toLowerCase() as SearchType }))));
	}

	public getCustom(type: SearchType): Observable<SearchResultItemResponse[]> {
		const params = new HttpParams().set("type", type);
		return this.http
			.get<SearchResultItemResponse[]>(`${this.path}/custom`, { params })
			.pipe(map(results => results.map<SearchResultItemResponse>(r => ({ ...r, type: r.type.toLowerCase() as SearchType }))));
	}
	public getSection(type: SearchType): Observable<SearchSectionResponse[]> {
		const params = new HttpParams().set("type", type);
		return this.http.get<SearchSectionResponse[]>(`${this.path}/section`, { params });
	}
}
