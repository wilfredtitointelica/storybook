import { CommonModule } from "@angular/common";
import { Component, ViewChild, computed, effect, inject, OnDestroy, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AlertService, GlobalTermService, SpinnerService, TermPipe } from "intelica-library-base";
import { AddFavoritesComponent, ColumnComponent, ElementService, TableComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { MenuItem } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { Button } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { finalize, Subscription } from "rxjs";
import { RecommendationResponse } from "../dto/tpe-responses.dto";
import { TpeFilterService } from "../tpe-filter/tpe-filter.service";
import { TpeService } from "../tpe.service";
import { Toast } from "primeng/toast";
const RECOMMENDATIONS_PERMISSION_CODE = "TAB_RECOMMENDATIONS";
@Component({
	selector: "fee-tpe-recomendations",
	imports: [
		Button,
		TableModule,
		TermPipe,
		TooltipModule,
		RouterLink,
		CommonModule,
		DialogModule,
		TableComponent,
		ColumnComponent,
		AddFavoritesComponent,
		Skeleton,
		Breadcrumb,
		Toast,
		StatusStateComponent,
	],
	templateUrl: "./tpe-recomendations.component.html",
	styles: ``,
})
export class TpeRecomendations implements OnDestroy {
	@ViewChild(TableComponent) tableRef!: TableComponent<RecommendationResponse>;

	private filterService = inject(TpeFilterService);
	public globalTermService = inject(GlobalTermService);
	private elementService = inject(ElementService);
	private tpeService = inject(TpeService);
	private router = inject(Router);
	private route = inject(ActivatedRoute);
	private termPipe = inject(TermPipe);
	private readonly alertService = inject(AlertService);

	public isNoData = this.filterService.isNoData;
	public statusStateEnum = StatusStateEnum;

	public allowTabRecommendations = this.elementService.HasElement(RECOMMENDATIONS_PERMISSION_CODE);
	private clientId = computed(() => this.filterService.filter().clientId);
	public loadingRecommendations = signal<boolean>(true);
	public readonly recommendations = signal<RecommendationResponse[]>([]);
	public currentSearchText = signal<string>("");
	private filteredCount = signal<number>(-1);

	get isNoMatchesState(): boolean {
		return !this.loadingRecommendations() && this.recommendations().length > 0 && this.currentSearchText().length > 0 && this.filteredCount() === 0;
	}

	get isNoDataState(): boolean {
		return !this.loadingRecommendations() && this.recommendations().length === 0;
	}

	private recommendationsSub: Subscription | null = null;
	constructor() {
		this.filterService.restoreTempFilter();
		effect(() => {
			const clientId = this.clientId();

			if (!clientId || !this.allowTabRecommendations) {
				// this.recommendations.set([]);
				// this.loadingRecommendations.set(false);
				return;
			}
			this.loadingRecommendations.set(true);
			this.filterService.beginFilterRequest();
			this.recommendationsSub?.unsubscribe();
			this.recommendationsSub = this.tpeService
				.getRecommendations(clientId)
				.pipe(finalize(() => this.filterService.endFilterRequest()))
				.subscribe({
					next: recommendations => {
						this.loadingRecommendations.set(false);
						this.recommendations.set(recommendations);
					},
					error: () => {
						this.loadingRecommendations.set(false);
						this.recommendations.set([]);
					},
				});
		});
	}

	private goBack() {
		this.router.navigate(["dashboard"], { relativeTo: this.route });
	}

	onRequestAcces() {
		this.tpeService.requestPermissionRecomendations().subscribe({
			next: success => {
				this.showResultGetSupportModal(success);
			},
		});
	}

	private showResultGetSupportModal(success: boolean) {
		if (success)
			this.alertService
				.show({
					title: this.getTerm("TpeResponseToRecommendationAccessRequestSummary"),
					subtitle: this.getTerm("TpeResponseToRecommendationAccessRequestDetail"),
					customIcon: "icon icon-sent",
				} as Parameters<AlertService["show"]>[0])
				.then(_ => this.goBack());
	}

	ngOnDestroy(): void {
		this.recommendationsSub?.unsubscribe();
	}

	fullItems: MenuItem[] = [
		{ label: "MastercardTPE", routerLink: "dashboard" },
		{
			label: "LBL_RECOMMENDATIONS",
		},
	];
	public onFilteredData(data: RecommendationResponse[]): void {
		this.filteredCount.set(data.length);
	}

	public onSearchChange(search: { searchText: string }): void {
		this.currentSearchText.set(search?.searchText ?? "");
	}

	public clearSearch(): void {
		this.tableRef?.ClearSearch();
	}

	private getTerm(key: string): string {
		return this.termPipe.transform(key, this.globalTermService.languageCode);
	}
}
