import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { GaTrackDirective } from "../../shared/analitycs";
import { Panel } from "primeng/panel";
import { Tabs, Tab, TabList, TabPanels, TabPanel } from "primeng/tabs";
import { Skeleton } from "primeng/skeleton";
import { BadgeModule } from "primeng/badge";
import { FeeOpportunitiesTab, BrandMetric } from "./opportunities.interface";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { CategoryEnum } from "../../common/enums/landing.enum";
import { BrandHelper } from "../../../common/helpers/common.helper";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";
@Component({
	selector: "fee-opportunities",
	imports: [FormsModule, CommonModule, GaTrackDirective, Panel, Tabs, Tab, TabList, TabPanels, TabPanel, Skeleton, BadgeModule, FormatValuePipe, TermPipe, StatusStateComponent],
	templateUrl: "./opportunities.html",
})
export class Opportunities {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);

	private _isloadingMainOpportunities = signal<boolean>(false);
	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);
	private categoryId = signal<number>(CategoryEnum.Penalties);

	public isloadingMainOpportunities = computed(() => this._isloadingMainOpportunities());
	private refresh = computed(() => this._refresh());
	public hasError = computed(() => this._hasError());

	public dataMainOpportunities = this.landingService.buildLandingParamSignal(
		(categoryId: number) => this.landingService.getMainOpportunities(categoryId),
		this.categoryId,
		this._isloadingMainOpportunities,
		this.refresh,
		this._hasError
	);

	public brandMetrics = computed<BrandMetric[]>(() =>
		(this.dataMainOpportunities()?.table ?? []).map(item => ({
			brandId: item.brandId,
			brandIcon: BrandHelper.getIcon(item.brandId),
			monthAmount: item.monthAmount,
			yearAmount: item.yearAmount,
			monthShort: item.monthShort,
			yearShort: item.yearShort,
		}))
	);

	public currencyCode = computed<string>(() => this.dataMainOpportunities()?.currencyCode ?? "-");
	public hasData = computed(() => (this.dataMainOpportunities()?.table?.length ?? 0) > 0);

	public monthResolveState = computed(() => {
		const percent = this.dataMainOpportunities()?.percentMonth ?? 0;
		return this.landingService.ResolveState(percent);
	});

	public yearResolveState = computed(() => {
		const percent = this.dataMainOpportunities()?.percentYear ?? 0;
		return this.landingService.ResolveState(percent);
	});

	feeOpportunitiesTab = FeeOpportunitiesTab;
	tabValue = signal<FeeOpportunitiesTab>(FeeOpportunitiesTab.Penalties);

	public statusStateEnum = StatusStateEnum;

	ngOnInit() {
		this.prefetchOtherTab();
	}

	private prefetchOtherTab(): void {
		this.landingService.getMainOpportunities(CategoryEnum.OptOutServices).subscribe({ error: () => {} });
	}

	reload() {
		this._refresh.update(n => n + 1);
	}

	public onTabChange(tab: FeeOpportunitiesTab): void {
		this.tabValue.set(tab);
		this.categoryId.set(this.resolveCategoryId(tab));
	}

	private resolveCategoryId(tab: FeeOpportunitiesTab): number {
		switch (tab) {
			case FeeOpportunitiesTab.Penalties:
				return CategoryEnum.Penalties;

			case FeeOpportunitiesTab.OptOutServices:
				return CategoryEnum.OptOutServices;

			default:
				return CategoryEnum.Penalties;
		}
	}
}
