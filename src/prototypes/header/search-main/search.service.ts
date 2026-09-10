import { computed, DestroyRef, inject, Injectable, signal } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { catchError, debounceTime, defer, distinctUntilChanged, finalize, forkJoin, map, Observable, of, switchMap, tap } from "rxjs";
import { SearchType } from "./dto/search-commands";
import { SearchResultItemResponse, SearchSectionResponse } from "./dto/search-responses";
import { SearchHttpService } from "./search-http.service";
import { ConfigService } from "intelica-library-base";

@Injectable({
	providedIn: "root",
})
export class SearchService {
	private readonly searchDebounceMs = 250;
	private readonly minSearchChars = 2;
	private _searchText = signal<string>("");
	private _type = signal<SearchType>(SearchType.ALL);
	private _searchResults = signal<SearchResultItemResponse[]>([]);
	private _isSearchPending = signal<boolean>(false);
	private _activeRequests = signal<number>(0);
	private _isSearching = computed<boolean>(() => this._activeRequests() > 0);
	private _recents = signal<SearchResultItemResponse[]>([]);
	private _favorites = signal<SearchResultItemResponse[]>([]);
	private _customs = signal<SearchResultItemResponse[]>([]);
	private _sections = signal<SearchSectionResponse[]>([]);
	private _topFees = signal<SearchResultItemResponse[]>([]);
	private _reports = signal<SearchResultItemResponse[]>([]);
	private _dashboards = signal<SearchResultItemResponse[]>([]);
	private readonly destroyRef = inject(DestroyRef);
	private readonly searchQuery = computed(() => ({ text: this._searchText().trim(), type: this._type() }));
	private readonly searchableTypes = Object.values(SearchType).filter(type => type !== SearchType.ALL);

	private searchHttpService = inject(SearchHttpService);
	private readonly configService = inject(ConfigService);
	public searchText = this._searchText.asReadonly();
	public searchType = this._type.asReadonly();
	public isSearching = computed<boolean>(() => this._isSearchPending() || this._isSearching());
	public recents = this._recents.asReadonly();
	public searchResults = this._searchResults.asReadonly();
	public favorites = this._favorites.asReadonly();
	public customs = this._customs.asReadonly();
	public sections = this._sections.asReadonly();
	public topFees = this._topFees.asReadonly();
	public reports = this._reports.asReadonly();
	public dashboards = this._dashboards.asReadonly();

	constructor() {
		if (this.configService.environment?.clientID === "ExternalNew") {
			this.searchEffect();
			this.searchRecents();
			this.getFavorites();
			this.getCustoms();
			this.getSections();
			this.getTopFees();
			this.getReports();
			this.getDashboards();
		}
	}
	getReports() {
		this.withLoading(this.searchHttpService.search({ type: SearchType.REPORTS, text: "" }))
			.pipe(
				catchError(() => of([] as SearchResultItemResponse[])),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(results => this._reports.set(this.enrichWithRecentSelectedAt(results.sort((a, b) => a.title.localeCompare(b.title)))));
	}
	getDashboards() {
		this.withLoading(this.searchHttpService.search({ type: SearchType.DASHBOARDS, text: "" }))
			.pipe(
				catchError(() => of([] as SearchResultItemResponse[])),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(results => this._dashboards.set(this.enrichWithRecentSelectedAt(results.sort((a, b) => a.title.localeCompare(b.title)))));
	}
	getTopFees() {
		this.withLoading(this.searchHttpService.getTopFees())
			.pipe(
				catchError(() => of([] as SearchResultItemResponse[])),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(results => this._topFees.set(this.enrichWithRecentSelectedAt(results)));
	}

	public clearText() {
		this._searchText.set("");
		this._isSearchPending.set(false);
	}

	public updateSearchType(type: SearchType) {
		if (this._type() === type) return;
		this._type.set(type);
		this._isSearchPending.set(this._searchText().trim().length >= this.minSearchChars);
	}

	public updateSearchText(text: string) {
		if (this._searchText() === text) return;
		this._searchText.set(text);
		this._isSearchPending.set(text.trim().length >= this.minSearchChars);
	}

	public saveRecentSearch(item: SearchResultItemResponse) {
		this.searchHttpService
			.saveRecentSearch({ type: item.type, entityId: item.entityId, title: item.title, action: item.action })
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe(() => this.searchRecents());
	}

	private searchEffect() {
		toObservable(this.searchQuery)
			.pipe(
				debounceTime(this.searchDebounceMs),
				distinctUntilChanged((prev, curr) => prev.text === curr.text && prev.type === curr.type),
				tap(({ text }) => {
					if (text.length < this.minSearchChars) {
						this._searchResults.set([]);
						this._isSearchPending.set(false);
					}
				}),
				switchMap(({ text, type }) => {
					if (text.length < this.minSearchChars) return of({ results: [] as SearchResultItemResponse[], text, type });

					this._isSearchPending.set(true);
					return this.withLoading(this.searchHttpService.search({ type, text })).pipe(
						map(results => ({ results, text, type })),
						catchError(() => of({ results: [] as SearchResultItemResponse[], text, type })),
						finalize(() => this._isSearchPending.set(false))
					);
				}),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ results, text, type }) => {
				const enrichedResults = this.enrichWithRecentSelectedAt(results);
				const queryText = this.normalizeText(text);
				const queryType = type;
				this._searchResults.set(this.rankByRelevance(enrichedResults, queryText, queryType));
			});
	}

	private getFavorites() {
		this.loadByTypes(
			type => this.searchHttpService.getFavorites(type),
			results => this._favorites.set(results)
		);
	}

	private getCustoms() {
		this.loadByTypes(
			type => this.searchHttpService.getCustom(type),
			results => this._customs.set(results)
		);
	}

	private getSections() {
		this.withLoading(this.searchHttpService.getSection(SearchType.FEES))
			.pipe(
				catchError(() => of([] as SearchSectionResponse[])),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(sections => this._sections.set(sections));
	}

	private searchRecents() {
		this.searchHttpService
			.getRecentSearches()
			.pipe(
				catchError(() => of([] as SearchResultItemResponse[])),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(results => {
				this._recents.set(results);
				this.refreshSelectedAtFromRecents();
			});
	}

	private loadByTypes(getItemsByType: (type: SearchType) => Observable<SearchResultItemResponse[]>, setItems: (items: SearchResultItemResponse[]) => void) {
		this.withLoading(forkJoin(this.searchableTypes.map(type => getItemsByType(type).pipe(catchError(() => of([] as SearchResultItemResponse[]))))))
			.pipe(
				map(resultByType => resultByType.flat()),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(results => setItems(this.enrichWithRecentSelectedAt(results)));
	}

	private withLoading<T>(source$: Observable<T>): Observable<T> {
		return defer(() => {
			this._activeRequests.update(count => count + 1);
			return source$.pipe(
				finalize(() => {
					this._activeRequests.update(count => (count > 0 ? count - 1 : 0));
				})
			);
		});
	}

	private buildRecentSelectedAtMap(): Map<string, string> {
		const selectedAtByItem = new Map<string, string>();
		for (const recent of this._recents()) {
			if (!recent.selectedAt) continue;
			selectedAtByItem.set(`${recent.type}|${recent.entityId}`, recent.selectedAt);
		}
		return selectedAtByItem;
	}

	private enrichWithRecentSelectedAt(items: SearchResultItemResponse[]): SearchResultItemResponse[] {
		const selectedAtByItem = this.buildRecentSelectedAtMap();
		return items.map(item => {
			const selectedAt = selectedAtByItem.get(`${item.type}|${item.entityId}`);
			if (selectedAt) return { ...item, selectedAt };
			if (item.selectedAt) return { ...item, selectedAt: undefined };
			return item;
		});
	}

	private refreshSelectedAtFromRecents() {
		this._searchResults.set(this.enrichWithRecentSelectedAt(this._searchResults()));
		this._favorites.set(this.enrichWithRecentSelectedAt(this._favorites()));
		this._customs.set(this.enrichWithRecentSelectedAt(this._customs()));
		this._topFees.set(this.enrichWithRecentSelectedAt(this._topFees()));
		this._reports.set(this.enrichWithRecentSelectedAt(this._reports()));
		this._dashboards.set(this.enrichWithRecentSelectedAt(this._dashboards()));
	}

	private rankByRelevance(items: SearchResultItemResponse[], searchText: string, type: SearchType): SearchResultItemResponse[] {
		const normalizedSearch = this.normalizeText(searchText);
		const filteredItems = type === SearchType.ALL ? items : items.filter(item => item.type === type);

		return [...filteredItems].sort((a, b) => {
			const scoreA = this.getRelevanceScore(a.title, normalizedSearch);
			const scoreB = this.getRelevanceScore(b.title, normalizedSearch);
			if (scoreA !== scoreB) return scoreB - scoreA;

			const selectedAtA = a.selectedAt ? Date.parse(a.selectedAt) : -Infinity;
			const selectedAtB = b.selectedAt ? Date.parse(b.selectedAt) : -Infinity;
			if (selectedAtA !== selectedAtB) return selectedAtB - selectedAtA;

			return a.title.localeCompare(b.title);
		});
	}

	private getRelevanceScore(title: string, normalizedSearch: string): number {
		const normalizedTitle = this.normalizeText(title);
		if (!normalizedSearch || !normalizedTitle) return 0;
		if (normalizedTitle === normalizedSearch) return 1000;
		if (normalizedTitle.startsWith(normalizedSearch)) return 900;

		const titleWords = normalizedTitle.split(" ");
		if (titleWords.some(word => word.startsWith(normalizedSearch))) return 800;

		const includesAt = normalizedTitle.indexOf(normalizedSearch);
		if (includesAt >= 0) return 700 - Math.min(includesAt, 300);

		return 0;
	}

	private normalizeText(value: string): string {
		return value
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/\s+/g, " ")
			.trim();
	}
}
