import { Component, computed, effect, inject, input, output, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GlobalTermService } from "intelica-library-base";
import { MessageService } from "primeng/api";
import { Button } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { Skeleton } from "primeng/skeleton";
import { DATE_PERIOD, DatepickerRange } from "../../common/datepicker-range/datepicker-range";
import { FEE_UPDATES_TERM } from "../common/constants";
import { DatePeriodEnum } from "../common/enums";
import { FeeUpdatesFilterOutput } from "../dto/fee-updates.dto";
import { FeeUpdatesBrandItem, FeeUpdatesBusinessItem, FeeUpdatesEntityItem } from "../dto/fee-updates-responses.dto";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-updates-header",
	standalone: true,
	imports: [FormsModule, Button, MultiSelectModule, Skeleton, DatepickerRange],
	templateUrl: "./header.html",
})
export class HeaderComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	private readonly messageService = inject(MessageService);
	public readonly feeUpdatesTerm = FEE_UPDATES_TERM;

	public loading = input<boolean>(false);
	public busy = input<boolean>(false);
	public entities = input<FeeUpdatesEntityItem[]>([]);
	public brands = input<FeeUpdatesBrandItem[]>([]);
	public businesses = input<FeeUpdatesBusinessItem[]>([]);
	public minDate = input<Date | null>(null);
	public maxDate = input<Date | null>(null);

	public apply = output<FeeUpdatesFilterOutput>();
	public reset = output<void>();

	public selectedEntityIds = signal<number[]>([]);
	public selectedBrandIds = signal<number[]>([]);
	public selectedBusinessIds = signal<number[]>([]);

	private datepicker = viewChild(DatepickerRange);
	public showEntitiesSelect = computed<boolean>(() => this.entities().length > 1);
	public isSingleBrand = computed<boolean>(() => this.brands().length <= 1);
	public isSingleBusiness = computed<boolean>(() => this.businesses().length <= 1);

	public entitySelectionLabel = computed<string>(() => {
		const all = this.entities();
		if (all.length > 0 && this.selectedEntityIds().length >= all.length) return this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_ALL_INSTITUTIONS);
		return this.commonGlobalService.termText(this.feeUpdatesTerm.INSTITUTIONS_SELECTED);
	});

	public brandSelectionLabel = computed<string>(() => {
		const all = this.brands();
		if (all.length > 0 && this.selectedBrandIds().length >= all.length) return this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_ALL_BRANDS);
		return this.commonGlobalService.termText(this.feeUpdatesTerm.BRANDS_SELECTED);
	});

	public businessSelectionLabel = computed<string>(() => {
		const all = this.businesses();
		if (all.length > 0 && this.selectedBusinessIds().length >= all.length) return this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_ALL_BUSINESSES);
		return this.commonGlobalService.termText(this.feeUpdatesTerm.BUSINESSES_SELECTED);
	});

	constructor() {
		effect(() => {
			const opts = this.entities();
			this.selectedEntityIds.set(opts.map(e => e.entityId));
		});
		effect(() => {
			const opts = this.brands();
			this.selectedBrandIds.set(opts.map(b => b.brandId));
		});
		effect(() => {
			const opts = this.businesses();
			this.selectedBusinessIds.set(opts.map(b => b.businessId));
		});
	}

	public onApply(): void {
		const range = this.datepicker()?.getCurrentRange();
		if (!range) return;
		if (!this.hasValidRequiredSelections()) return;
		this.apply.emit({
			entityIds: this.selectedEntityIds(),
			brandIds: this.selectedBrandIds(),
			businessIds: this.selectedBusinessIds(),
			period: range.period as unknown as DatePeriodEnum,
			startDate: this.commonGlobalService.formatDateOnly(range.start),
			endDate: this.commonGlobalService.formatDateOnly(range.end),
		});
	}

	private hasValidRequiredSelections(): boolean {
		if (this.showEntitiesSelect() && this.selectedEntityIds().length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_ENTITIES));
			return false;
		}
		if (this.brands().length > 0 && this.selectedBrandIds().length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_BRANDS));
			return false;
		}
		if (this.businesses().length > 0 && this.selectedBusinessIds().length === 0) {
			this.showRequiredFilterToast(this.commonGlobalService.termText(this.feeUpdatesTerm.FLT_BUSINESSES));
			return false;
		}
		return true;
	}

	private showRequiredFilterToast(filterName: string): void {
		this.messageService.add({
			severity: "warn",
			icon: "icon icon-warning",
			summary: this.commonGlobalService.termText(this.feeUpdatesTerm.REQUIRED_FILTER),
			detail: `${this.commonGlobalService.termText(this.feeUpdatesTerm.SELECT_AT_LEAST_ONE_BEFORE_APPLYING)} ${filterName}.`,
		});
	}

	public onReset(): void {
		this.selectedEntityIds.set(this.entities().map(e => e.entityId));
		this.selectedBrandIds.set(this.brands().map(b => b.brandId));
		this.selectedBusinessIds.set(this.businesses().map(b => b.businessId));
		this.datepicker()?.applyPreset(DATE_PERIOD.Last12Months);
		this.reset.emit();
	}
}
