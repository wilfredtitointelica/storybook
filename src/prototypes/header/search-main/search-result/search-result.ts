import { CommonModule } from "@angular/common";
import { Component, computed, effect, ElementRef, inject, output, signal, viewChildren, ViewEncapsulation } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import { HighlightDirective } from "../directives/highlight.directive";
import { FeeSection, SearchType } from "../dto/search-commands";
import { SearchResultItemResponse } from "../dto/search-responses";
import { FeeLibrarySearchHandoffService } from "../fee-library-search-handoff.service";
import { TimeAgoPipe } from "../pipe/time-ago.pipe";
import { resolveResultIconClass } from "../search-main.domain";
import { SearchService } from "../search.service";

import { Skeleton } from "primeng/skeleton";

type SearchItems = { title: string; type: SearchType; isTerm?: boolean; items: SearchResultItemResponse[] };
type LabelRoute = { label: string; route: string };

const MAX_RESULTS_PER_CATEGORY = 4;
const MAX_FAVORITES_PER_CATEGORY = 4;
const MAX_CUSTOM_PER_CATEGORY = 4;
const MAX_RECENTS_PER_CATEGORY = 2;
const MIN_SEARCH_CHARS = 2;

@Component({
	selector: "search-result",
	imports: [CommonModule, RouterLink, Button, Tooltip, TermPipe, TimeAgoPipe, HighlightDirective, Skeleton],
	templateUrl: "./search-result.html",
	encapsulation: ViewEncapsulation.None,
})
export class SearchResult {
	public textTooltips = viewChildren<ElementRef<HTMLElement>>("textTooltip");

	public globalTermService = inject(GlobalTermService);
	private configService = inject(ConfigService);
	private searchService = inject(SearchService);
	private feeLibrarySearchHandoff = inject(FeeLibrarySearchHandoffService);

	private router = inject(Router);

	public searchText = this.searchService.searchText;
	public searchType = this.searchService.searchType;
	public searchResults = this.searchService.searchResults;
	public searchRecents = this.searchService.recents;
	public isSearching = this.searchService.isSearching;

	public readonly customButtomTypes = [SearchType.REPORTS, SearchType.DASHBOARDS];

	public readonly resolveResultIconClass = resolveResultIconClass;

	private readonly favoriteReportTerm = "Favorite Reports";
	private readonly customReportTerm = "CUSTOM_REPORTS";
	private readonly favoriteDashboardTerm = "FAVORITE_DASHBOARDS";
	private readonly customDashboardTerm = "CUSTOM_DASHBOARDS";

	public readonly maxLenResult = 75;

	public readonly customTerms = [this.customReportTerm, this.customDashboardTerm];

	public isFirstSearch = computed<boolean>(() => this.searchText() === "");
	public hasMinSearchChars = computed<boolean>(() => this.searchText().trim().length >= MIN_SEARCH_CHARS);

	public filterButtons = computed<{ label: string; value: SearchType }[]>(() => {
		const options = [
			{
				label: "All",
				value: SearchType.ALL,
			},
			{
				label: "Fees",
				value: SearchType.FEES,
			},
			{
				label: "Reports",
				value: SearchType.REPORTS,
			},
		];
		return options;
	});

	public resultsFirstSearch = computed<SearchItems[]>(() => {
		const type = this.searchType();
		switch (type) {
			case SearchType.ALL:
				return this.buidlAllFirstSearch();
			case SearchType.FEES:
				return this.buidlFeeFirstSearch();
			case SearchType.REPORTS:
				return this.buildCommonFirstSearch(type, this.favoriteReportTerm, this.customReportTerm);
			case SearchType.DASHBOARDS:
				return this.buildCommonFirstSearch(type, this.favoriteDashboardTerm, this.customDashboardTerm);
			default:
				return [];
		}
	});

	public resultsSearch = computed<SearchItems[]>(() => {
		const results = this.searchResults();
		const type = this.searchType();

		if (type === SearchType.ALL) {
			const sections = [
				{ title: "Fees", type: SearchType.FEES },
				{ title: "Reports", type: SearchType.REPORTS },
				{ title: "Dashboards", type: SearchType.DASHBOARDS },
			];

			const result = sections
				.map(section => ({
					title: section.title,
					type: section.type,
					items: results.filter(r => r.type === section.type),
				}))
				.filter(section => section.items.length > 0);

			return result;
		}

		const items = results.filter(r => r.type === type);

		return [
			{
				title: type === SearchType.FEES ? "Fees" : type === SearchType.REPORTS ? "Reports" : "Dashboards",
				type: type,
				items: items,
			},
		];
	});
	public hasSearchResults = computed<boolean>(() => this.resultsSearch().some(section => section.items.length > 0));

	public viewButton = computed<LabelRoute>(() => this.getViewButton(this.searchType()));
	public createButton = computed<LabelRoute>(() => this.getCreateButton(this.searchType()));

	public closeResult = output<void>();

	constructor() {}

	public onSelectSearchResult(item: SearchResultItemResponse, title: string) {
		const blockedSaves = [FeeSection.Category].map(x => x.toString());
		const saveAsRecent = !blockedSaves.includes(title);
		if (item.action.kind === "navigate") {
			if (item.type === SearchType.REPORTS) {
				const url = this.buildExternalUrl(`${this.configService.environment?.incontrolBaseUrl}/${item.action.route}`, item.action.params);
				window.open(url, "_blank", "noopener,noreferrer");
			}
			if (item.type != SearchType.REPORTS) this.router.navigate([item.action.route, item.action.params.feeId, "-1"]);
		}
		if (saveAsRecent && item.action.kind === "navigate") {
			this.searchService.saveRecentSearch(item);
		}
		this.closeResult.emit();
	}

	public onSelectSearchType(type: SearchType) {
		this.searchService.updateSearchType(type);
	}

	public onViewButtonClick() {
		if (this.searchType() === SearchType.FEES) {
			this.feeLibrarySearchHandoff.saveSearchText(this.searchText());
		}
		this.closeResult.emit();
	}

	private buidlAllFirstSearch(): SearchItems[] {
		const topFees = this.searchService.topFees();

		const favoritesReports = this.searchService.favorites().filter(r => r.type === SearchType.REPORTS);
		const favoritesDashboards = this.searchService.favorites().filter(r => r.type === SearchType.DASHBOARDS);
		const reportsSearch = this.searchService.reports().filter(r => r.type === SearchType.REPORTS);
		const dashboardsSearch = this.searchService.dashboards().filter(r => r.type === SearchType.DASHBOARDS);

		const allReports = favoritesReports.length > 0 ? favoritesReports : reportsSearch;
		const allDashboard = favoritesDashboards.length > 0 ? favoritesDashboards : dashboardsSearch;

		const groupedResponse: SearchItems[] = [
			{ title: "Fees", type: SearchType.FEES, items: topFees },
			{ title: "Reports", type: SearchType.REPORTS, items: allReports },
			{ title: "Dashboards", type: SearchType.DASHBOARDS, items: allDashboard },
		];

		groupedResponse.forEach(section => {
			if (section.items.length > MAX_RESULTS_PER_CATEGORY) {
				section.items = section.items.slice(0, MAX_RESULTS_PER_CATEGORY);
			}
		});

		return groupedResponse;
	}

	private buidlFeeFirstSearch(): SearchItems[] {
		const recents = this.searchRecents().filter(r => r.type === SearchType.FEES);
		const sections = this.searchService.sections();
		const sectionCoreResults = sections.find(s => s.title == FeeSection.Core)?.items ?? [];
		const sectionNonCoreResults = sections.find(s => s.title == FeeSection.NonCore)?.items ?? [];
		const sectionCategoryResults = [...sectionCoreResults, ...sectionNonCoreResults];

		const feesResults: SearchItems[] = [
			{
				title: "RECENTS",
				type: SearchType.FEES,
				items: recents.slice(0, MAX_RECENTS_PER_CATEGORY),
			},
			{
				title: FeeSection.Category,
				type: SearchType.FEES,
				isTerm: true,
				items:
					sectionCategoryResults.map<SearchResultItemResponse>(item => ({
						entityId: item.id,
						title: item.name,
						type: SearchType.FEES,
						action: { kind: "navigate", route: "fee/library", params: { categoryId: item.id } },
					})) ?? [],
			},
		];
		return feesResults;
	}

	private buildCommonFirstSearch(type: SearchType, favoriteTerm: string, customTerm: string): SearchItems[] {
		const recents = this.searchRecents().filter(r => r.type === type);
		const favorites = this.searchService.favorites().filter(r => r.type === type);
		const custom = this.searchService.customs().filter(r => r.type === type);

		const reportsResults: SearchItems[] = [
			{
				title: "RECENTS",
				type: type,
				items: recents.slice(0, MAX_RECENTS_PER_CATEGORY),
			},
			{
				title: favoriteTerm,
				type: type,
				items: favorites.slice(0, MAX_FAVORITES_PER_CATEGORY),
			},
			{
				title: customTerm,
				type: type,
				items: custom.slice(0, MAX_CUSTOM_PER_CATEGORY),
			},
		];

		return reportsResults;
	}

	private getCreateButton(currentType: SearchType): LabelRoute {
		switch (currentType) {
			case SearchType.REPORTS:
				return { label: "CREATE_CUSTOM_REPORT", route: "/fee/report/custom" };
			case SearchType.DASHBOARDS:
				return { label: "CREATE_CUSTOM_DASHBOARD", route: "/fee/dashboard/custom" };
			default:
				return { label: "", route: "" };
		}
	}

	private getViewButton(currentType: SearchType): LabelRoute {
		switch (currentType) {
			case SearchType.FEES:
				return { label: "VIEW_FEE_LIBRARY", route: "/fee/library" };
			case SearchType.REPORTS:
				return { label: "VIEW_ALL_REPORTS", route: "/fee/reports" };
			case SearchType.DASHBOARDS:
				return { label: "VIEW_ALL_DASHBOARDS", route: "/fee/dashboard" };
			default:
				return { label: "", route: "" };
		}
	}

	private buildExternalUrl(route: string, params?: Record<string, any>): string {
		const url = new URL(route);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, value.toString());
				}
			});
		}

		return url.toString();
	}

	// --- tooltip en text overflow

	isTextOverflow = false;

	checkTextOverflow(element: HTMLElement): void {
		this.isTextOverflow = element.scrollWidth > element.clientWidth;
	}
}
