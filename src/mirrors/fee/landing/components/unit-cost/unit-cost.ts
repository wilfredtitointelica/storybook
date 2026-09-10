import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GaTrackDirective } from "../../shared/analitycs";
import { Panel } from "primeng/panel";
import { TableModule } from "primeng/table";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Skeleton } from "primeng/skeleton";
import { Select } from "primeng/select";
import { UnitCostByProductTable, UnitCostTab } from "./unit-cost.interface";
import { ColumnComponent, RowResumenComponent, TableComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { LandingService } from "../../landing.service";
import { BusinessTrasactionEnum, UnitCostTypeEnum } from "../../common/enums/landing.enum";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
@Component({
	selector: "fee-unit-cost",
	imports: [
		CommonModule,
		FormsModule,
		GaTrackDirective,
		Panel,
		TableModule,
		Tabs,
		TabList,
		Tab,
		TabPanels,
		TabPanel,
		Skeleton,
		Select,
		FormatValuePipe,
		TableComponent,
		ColumnComponent,
		RowResumenComponent,
		TermPipe,
		StatusStateComponent,
	],
	templateUrl: "./unit-cost.html",
})
export class UnitCost {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly landingService = inject(LandingService);

	private _isloadingUnitCostByProduct = signal<boolean>(false);
	private _refresh = signal<number>(0);
	private _hasError = signal<boolean>(false);

	public isloadingUnitCostByProduct = computed(() => this._isloadingUnitCostByProduct());
	private refresh = computed(() => this._refresh());
	public hasError = computed(() => this._hasError());

	public currencyCode = computed<string>(() => this.dataUnitCostByProduct()?.currencyCode ?? "-");

	public unitCostTypeId = signal<number>(UnitCostTypeEnum.Fixed);
	public unitCostTypeEnum = UnitCostTypeEnum;

	public businessTransactionId = signal<number>(BusinessTrasactionEnum.All);
	public businessTransactionOptions = [
		{ id: BusinessTrasactionEnum.All, term: "ALL_BUSINESSES" },
		{ id: BusinessTrasactionEnum.Issuer, term: "ISSUER" },
		{ id: BusinessTrasactionEnum.AcquirerMerchant, term: "ACQUIRER_MERCHANT" },
		{ id: BusinessTrasactionEnum.AcquirerCash, term: "ACQUIRER_CASH" },
	];

	public get businessTransactionSelectWidth(): string {
		return this.globalTermService.languageCode?.toLowerCase() === "es" ? "12rem" : "11rem";
	}

	private unitCostParams = computed(() => ({
		unitCostTypeId: this.unitCostTypeId(),
		businessTransactionId: this.businessTransactionId(),
	}));

	public dataUnitCostByProduct = this.landingService.buildLandingParamSignal(
		(params: { unitCostTypeId: number; businessTransactionId: number }) => this.landingService.getUnitCostByProduct(params.unitCostTypeId, params.businessTransactionId),
		this.unitCostParams,
		this._isloadingUnitCostByProduct,
		this.refresh,
		this._hasError
	);

	public columns = computed(() => this.dataUnitCostByProduct()?.quarters ?? []);
	public qoqHeaderLabel = computed<string>(() => {
		const quarters = this.columns();
		const oldest = quarters[0];
		const current = quarters[quarters.length - 1];
		return oldest && current && oldest !== current ? `${current.label} vs. ${oldest.label}` : "QoQ";
	});
	public rows = computed<UnitCostByProductTable[]>(() =>
		(this.dataUnitCostByProduct()?.table ?? [])
			.filter(x => x.brandIndId !== -1)
			.map<UnitCostByProductTable>(x => ({
				...x,
				qoqState: this.landingService.ResolveState(x.qoq),
				qoqIcon: this.landingService.GetTrendIcon(x.qoq),
			}))
	);
	public total = computed(() =>
		(this.dataUnitCostByProduct()?.table ?? [])
			.filter(x => x.brandIndId === -1)
			.map(x => ({
				...x,
				qoqState: this.landingService.ResolveState(x.qoq),
				qoqIcon: this.landingService.GetTrendIcon(x.qoq),
			}))
	);

	public totalCol5Status = computed(() => {
		const percent = this.total()[0]?.col5 ?? 0;
		return this.landingService.ResolveState(percent);
	});
	public totalQoqStatus = computed(() => {
		const percent = this.total()[0]?.qoq ?? 0;
		return this.landingService.ResolveState(percent);
	});

	public hasRows = computed<boolean>(() => this.rows().length > 0);

	unitCostTab = UnitCostTab;
	tabValue = signal<UnitCostTab>(UnitCostTab.Fixed);

	public statusStateEnum = StatusStateEnum;
	public unitCostPrecision: number = 4;

	ngOnInit() {}

	reload() {
		this._refresh.update(n => n + 1);
	}

	public onTabChange(tab: UnitCostTab): void {
		this.tabValue.set(tab);
		this.unitCostTypeId.set(this.resolveCategoryId(tab));
	}

	public onBusinessTransactionChange(businessTransactionId: number): void {
		this.businessTransactionId.set(businessTransactionId);
	}

	private resolveCategoryId(tab: UnitCostTab): number {
		switch (tab) {
			case UnitCostTab.Fixed:
				return UnitCostTypeEnum.Fixed;

			case UnitCostTab.Variable:
				return UnitCostTypeEnum.Variable;

			default:
				return UnitCostTypeEnum.Fixed;
		}
	}
}
