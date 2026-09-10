import { Component, computed, effect, inject, signal, untracked, ViewChild, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { DatePicker, DatePickerModule } from "primeng/datepicker";
import { MultiSelect } from "primeng/multiselect";
import { Select } from "primeng/select";
import { Skeleton } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { TpeFilterDto } from "./dto/tpe-filter.dto";
import { TpeDatePreset, TpeFilterService, TPE_DATE_PRESETS } from "./tpe-filter.service";
import { CommonModule } from "@angular/common";
import { PrimeNG } from "primeng/config";
import { MessageService } from "primeng/api";
interface Brand {
	code: string;
	name: string;
}

@Component({
	selector: "fee-tpe-filter",
	imports: [FormsModule, Select, TermPipe, MultiSelect, Button, DatePicker, DatePickerModule, Skeleton, CommonModule, TooltipModule],
	templateUrl: "./tpe-filter.component.html",
})
export class TpeFilter {
	public globalTermService = inject(GlobalTermService);
	private filterService = inject(TpeFilterService);
	private readonly termPipe = inject(TermPipe);
	private readonly messageService = inject(MessageService);

	public filterTemp = this.filterService.filterTemp;
	public isLoadingClients = this.filterService.isLoadingClients;
	public isLoadingFilters = this.filterService.isLoadingFilters;
	public selectedClient = this.filterService.selectedClientTemp;
	public clients = this.filterService.clients;
	public isNoData = this.filterService.isNoData;

	public icaOptions = computed<string[]>(() => {
		const filters = this.filterService.filterOptions();
		return filters ? filters.icas : [];
	});
	public groupViewEnabled = computed<boolean>(() => this.clients().length > 1);

	public brandsFilterOptions = signal<Brand[]>([{ code: "brand-2", name: "Mastercard" }]);
	public selectedBrandFilter = signal<Brand | null>(this.brandsFilterOptions()[0]);

	public selectedDateRange: Date[] | null = null;
	@ViewChild("picker") picker!: DatePicker;
	public dateRangePicker = viewChild<DatePicker>("dateRangePicker");

	public datePickerOptions = computed<{ minDate: Date; maxDate: Date; disabledDates: Date[] }>(() => {
		const { minDate = new Date(), maxDate = new Date(), disabledDates = [] } = this.selectedClient() ?? {};

		const minYear = minDate.getFullYear();
		const maxYear = maxDate.getFullYear();

		this.years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
		return { minDate, maxDate, disabledDates };
	});

	public isReadonlyIca = computed(() => this.icaOptions().length <= 1);

	private viewedDate = signal<Date>(new Date());
	private viewedView = signal<"date" | "month" | "year">("date");

	public canGoPrev = computed(() => {
		const min = this.datePickerOptions().minDate;
		if (!min) return true;
		const viewed = this.viewedDate();
		switch (this.viewedView()) {
			case "month":
				return min.getFullYear() < viewed.getFullYear();
			case "year":
				return min.getFullYear() < decadeStart(viewed.getFullYear());
			default:
				return isMonthBefore(min, viewed);
		}
	});

	public canGoNext = computed(() => {
		const max = this.datePickerOptions().maxDate;
		const viewed = this.viewedDate();
		switch (this.viewedView()) {
			case "month":
				return viewed.getFullYear() < max.getFullYear();
			case "year":
				return decadeStart(viewed.getFullYear()) + 9 < max.getFullYear();
			default:
				return isMonthBefore(viewed, max);
		}
	});

	public panelClasses = computed(() => {
		const classes: string[] = [];
		if (!this.canGoPrev()) classes.push("prDatapicker--noPrev");
		if (!this.canGoNext()) classes.push("prDatapicker--noNext");
		return classes.join(" ");
	});

	public presetsState = computed(() => {
		const { minDate: min, maxDate: max } = this.datePickerOptions();
		const activePreset = this.filterService.activePresetTemp();
		const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

		const defs: [TpeDatePreset, string, Date, Date][] = [
			[TPE_DATE_PRESETS.LAST_12_MONTHS, "LBL_LAST_12_MONTHS", new Date(today.getFullYear(), today.getMonth() - 11, 1), today],
			[TPE_DATE_PRESETS.CURRENT_YEAR, "CurrentYear", new Date(today.getFullYear(), 0, 1), today],
			[TPE_DATE_PRESETS.CURRENT_MONTH, "LBL_CURRENT_MONTH", new Date(today.getFullYear(), today.getMonth(), 1), today],
		];

		return defs.map(([preset, termKey, start, end]) => {
			const available = start <= max && end >= min;
			return { preset, termKey, active: activePreset === preset && available, disabled: !available };
		});
	});

	public selectedBrands = signal<string[]>(["brand-2"]);
	public isApplying = this.filterService.isApplying;

	public isBrandsReadonly = computed(() => this.brandsFilterOptions().length <= 1);

	public selectedBrandsLabel = computed(() => {
		const selected = this.selectedBrands();
		const brands = this.brandsFilterOptions();
		if (selected.length === 0) return "";
		if (selected.length === brands.length && brands.length > 1) return this.termPipe.transform("ALL_BRANDS", this.globalTermService.languageCode);
		if (selected.length === 1) return brands.find(b => b.code === selected[0])?.name ?? "";
		return `${selected.length} ${this.termPipe.transform("SELECTED_BRANDS", this.globalTermService.languageCode)}`;
	});

	private syncViewedState(): void {
		if (!this.picker) return;
		const dp = this.picker as unknown as { currentMonth?: number; currentYear?: number; currentView?: string };
		if (dp.currentView === "date" || dp.currentView === "month" || dp.currentView === "year") {
			this.viewedView.set(dp.currentView);
		}
		if (typeof dp.currentMonth === "number" && typeof dp.currentYear === "number") {
			this.viewedDate.set(new Date(dp.currentYear, dp.currentMonth, 1));
		}
	}

	public onPanelInteract(): void {
		this.syncViewedState();
		this.highlightYearRange();
	}

	private syncDateRangeFromFilter(): void {
		const datesFromFilter = this.filterService.getDatesFromRange(this.filterTemp()) ?? null;
		this.selectedDateRange = datesFromFilter;
	}

	OnSelectIcas(values: string[]) {
		this.filterService.applyIcas(values);
	}

	public OnSelectClient(clientId: number) {
		this.filterService.selectClient(clientId);
	}

	public OnDateRangeChange(range: (Date | null)[] | null) {
		if (!range?.[0] || !range?.[1]) return;
		this.filterService.applyDateRange([range[0], range[1]]);
	}

	public onCalendarClose(): void {
		const range = this.selectedDateRange;
		if (!range?.[0] || range[1]) return;
		this.selectedDateRange = [range[0], range[0]];
		this.OnDateRangeChange(this.selectedDateRange);
	}

	public selectedCurrentMonth = computed(() => this.filterService.activePresetTemp() === TPE_DATE_PRESETS.CURRENT_MONTH);

	ApplyCurrentMonth() {
		this.applyPreset(TPE_DATE_PRESETS.CURRENT_MONTH);
	}

	public selectedLast12Months = computed(() => this.filterService.activePresetTemp() === TPE_DATE_PRESETS.LAST_12_MONTHS);

	ApplyLast12Months() {
		this.applyPreset(TPE_DATE_PRESETS.LAST_12_MONTHS);
	}

	public selectedCurrentYear = computed(() => this.filterService.activePresetTemp() === TPE_DATE_PRESETS.CURRENT_YEAR);

	ApplyCurrentYear() {
		this.applyPreset(TPE_DATE_PRESETS.CURRENT_YEAR);
	}

	public applyPreset(preset: TpeDatePreset): void {
		this.filterService.applyPreset(preset);
		// this.picker.hideOverlay();
	}

	onDatepickerOpen() {
		const datesFromFilter = this.filterService.getDatesFromRange(this.filterTemp()) ?? null;
		if (!datesFromFilter) return;
		const date = datesFromFilter[1] ?? datesFromFilter[0];
		this.viewMonth = date.getMonth();
		this.viewYear = date.getFullYear();
		this.syncViewedState();
	}
	goToMonthYear(month: number, year: number) {
		this.picker.currentMonth = month;
		this.picker.currentYear = year;
		this.picker.createMonths(this.picker.currentMonth, this.picker.currentYear);
	}

	onViewChange() {
		this.goToMonthYear(this.viewMonth, this.viewYear);
	}
	onMonthChange(e: any) {
		this.viewMonth = this.picker.currentMonth;
		this.viewYear = this.picker.currentYear;
		this.syncViewedState();
	}

	onYearChange(e: any) {
		this.viewYear = this.picker.currentYear;
		this.syncViewedState();
	}

	private highlightYearRange(): void {
		const dates = this.selectedDateRange;
		if (!dates?.[0] || !dates?.[1]) return;

		const startYear = dates[0].getFullYear();
		const endYear = dates[1].getFullYear();
		if (startYear >= endYear) return;

		const dp = this.picker as any;
		const panel: HTMLElement | null = dp?.overlayViewChild?.nativeElement ?? dp?.overlayViewChild?.el?.nativeElement ?? document.querySelector(".p-datepicker-panel");
		if (!panel) return;

		panel.querySelectorAll<HTMLElement>("span.p-datepicker-year").forEach(el => {
			const year = parseInt(el.textContent?.trim() ?? "0");
			if (!year) return;
			if (year > startYear && year <= endYear) {
				el.classList.add("p-datepicker-year-selected");
			}
		});
	}

	public onApply() {
		const filter = this.filterTemp();
		if (!this.validateFilters(filter)) return;
		this.filterService.applyFilter();
	}

	public onClear() {
		this.filterService.clearFilter();
	}

	toggleBrand(code: string) {
		this.selectedBrands.update(current => {
			const index = current.indexOf(code);
			if (index > -1) return current.filter((_, i) => i !== index);
			return [...current, code];
		});
	}

	viewMonth!: number;
	viewYear!: number;

	months: { label: string; value: number }[] = [];

	years: number[] = [];

	public selectedIcasLabel = computed(() => {
		const selected = this.filterTemp().icas ?? [];
		const icas = this.icaOptions() ?? [];
		if (selected.length === 0) return "";
		if (selected.length === icas.length && icas.length > 1) return this.termPipe.transform("ALL_ICAS", this.globalTermService.languageCode);
		return this.buildLabelIcas(selected, id => icas.find(x => x === id), "SELECTED_ICAS");
	});

	constructor(private primeng: PrimeNG) {
		effect(() => {
			this.syncDateRangeFromFilter();
		});
		this.months =
			this.primeng?.translation?.monthNames?.map((m, i) => ({
				label: m,
				value: i,
			})) ?? [];
	}

	private buildLabelIcas(selectedIds: string[], getName: (id: string) => string | undefined, typeTerm?: string): string {
		if (selectedIds.length === 0) return "";
		if (selectedIds.length === 1) return getName(selectedIds[0]) ?? "";
		const selected = `${selectedIds.length}`;
		return typeTerm ? `${selected} ${this.termPipe.transform(typeTerm, this.globalTermService.languageCode)}` : selected;
	}

	private validateFilters(filter: TpeFilterDto): boolean {
		let isValid = true;

		const messageSelect = this.termPipe.transform("SELECT_AT_LEAST_ONE_BEFORE_APPLYING", this.globalTermService.languageCode);
		const messageDate = this.termPipe.transform("SELECT_A_RANGE_BEFORE_APPLYING", this.globalTermService.languageCode);

		type Rule<T> = {
			field: T;
			message: string;
			skip?: boolean;
			isValid: (v: T) => boolean;
		};

		const rules: Rule<any>[] = [
			{
				field: filter.icas,
				message: `${messageSelect} ${this.termPipe.transform("ICAS", this.globalTermService.languageCode)}.`,
				isValid: (v: number[]) => v?.length > 0,
			},
			{
				field: this.selectedDateRange,
				message: `${messageDate}.`,
				isValid: (v: Date[]) => this.isValidDateRange(v),
			},
		];

		for (const rule of rules) {
			if (rule.skip) continue;

			if (!rule.isValid(rule.field)) {
				this.showRequiredFilterToast(rule.message);
				isValid = false;
			}
		}

		return isValid;
	}

	private isValidDateRange(v: Date[]): boolean {
		return Array.isArray(v) && v.length === 2 && v.every(d => d instanceof Date && !isNaN(d.getTime())) && v[0].getTime() <= v[1].getTime();
	}

	private showRequiredFilterToast(message: string): void {
		this.messageService.add({
			severity: "warn",
			summary: this.termPipe.transform("REQUIRED_FILTER", this.globalTermService.languageCode),
			detail: message,
		});
	}
}

function isMonthBefore(a: Date, b: Date): boolean {
	return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

function decadeStart(year: number): number {
	return year - (year % 10);
}
