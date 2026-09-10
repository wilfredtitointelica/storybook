import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DatePicker, DatePickerModule } from "primeng/datepicker";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { OptOutServicesFilterResponse } from "../../dto/opt-out-service-responses.dto";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { OptOutServiceFilterService } from "./service/opt-out-service-filter.service";
import { OptOutServicesService } from "../../opt-out-service.service";
import { PeriodFilterTypeEnum } from "../../common/enums/opt-out-service.enum";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { OptOutServiceFilter as OptOutFilterModel } from "../../dto/opt-out-service-commands.dto";
import { Tooltip } from "primeng/tooltip";

@Component({
	selector: "fee-opt-out-service-filter",
	standalone: true,
	imports: [TermPipe, CommonModule, FormsModule, ButtonModule, DatePickerModule, MultiSelectModule, SelectModule, TagModule, SkeletonModule, Tooltip],
	templateUrl: "./opt-out-service-filter.html",
})
export class OptOutServiceFilter {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly configService = inject(ConfigService);
	private readonly optOutServiceFilter = inject(OptOutServiceFilterService);
	private readonly optOutServicesService = inject(OptOutServicesService);
	private readonly router = inject(Router);
	private readonly messageService = inject(MessageService);
	private readonly termPipe = inject(TermPipe);

	public filter = this.optOutServiceFilter.filter;
	public filterTemp = this.optOutServiceFilter.filterTemp;
	public isApplying = this.optOutServicesService.isApplying;

	private readonly sessionInformation = signal(this.configService.SessionInformation);
	private readonly urlSignal = signal(this.router.url);
	private datesTemp = signal<Date[]>(this.filterTemp().dates);
	private dateTypeTemp = signal<number>(this.filterTemp().dateTypeId);

	private datepickerRef = viewChild<DatePicker>("dpRange");
	private viewedDate = signal<Date>(new Date());
	private viewedView = signal<"date" | "month" | "year">("month");

	public isGroup = computed(() => this.sessionInformation()?.isGroup ?? false);
	public isLoadingFilters = computed(() => this.optOutServiceFilter.isLoadingFilters());
	public datePickerOptions = computed<{ minDate: Date; maxDate: Date; disabledDates: Date[] }>(() => {
		const custom = this.optOutServiceFilter.filterOptions().periods.find(p => p.filterType === PeriodFilterTypeEnum.Custom);

		if (!custom) {
			return {
				minDate: new Date(),
				maxDate: new Date(),
				disabledDates: [],
			};
		} else {
			return {
				minDate: new Date(custom.startDate),
				maxDate: new Date(custom.endDate),
				disabledDates: [],
			};
		}
	});
	public dynamicMinDate = computed(() => {
		const { minDate } = this.datePickerOptions();
		return this.getDateOrDefault(0, minDate, this.dateTypeTemp(), this.datesTemp());
	});
	public dynamicMaxDate = computed(() => {
		const { maxDate } = this.datePickerOptions();
		return this.getDateOrDefault(1, maxDate, this.dateTypeTemp(), this.datesTemp());
	});
	public listFilters = computed<OptOutServicesFilterResponse>(() => this.optOutServiceFilter.filterOptions());
	public isDatePickerDisabled = computed(() => {
		const url = this.urlSignal();
		return ["/savings", "/upcoming"].some(r => url.includes(r));
	});

	public isBrandsReadonly = computed(() => this.listFilters().brands.length <= 1);
	public isBusinessesReadonly = computed(() => this.listFilters().business.length <= 1);

	public canGoPrev = computed(() => {
		const min = this.dynamicMinDate();
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
		const max = this.dynamicMaxDate();
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
		const activeTypeId = this.filterTemp().dateTypeId;
		const today = new Date();

		const defs: [PeriodFilterTypeEnum, string, Date, Date][] = [
			[PeriodFilterTypeEnum.Last12Months, "LAST_12_MONTHS", new Date(today.getFullYear(), today.getMonth() - 11, 1), today],
			[PeriodFilterTypeEnum.CurrentYear, "CURRENT_YEAR", new Date(today.getFullYear(), 0, 1), today],
		];

		return defs.map(([typeId, label, start, end]) => {
			const available = start <= max && end >= min;
			return { typeId, label, active: activeTypeId === typeId, disabled: false };
		});
	});

	constructor() {
		effect(() => {
			const temp = this.filterTemp();
			this.datesTemp.set(temp.dates);
			this.dateTypeTemp.set(temp.dateTypeId);
		});
	}

	ngOnInit() {
		this.restoreFilterTemp();
	}

	private syncViewedState(): void {
		const dp = this.datepickerRef() as unknown as { currentMonth?: number; currentYear?: number; currentView?: string };
		if (!dp) return;
		if (dp.currentView === "date" || dp.currentView === "month" || dp.currentView === "year") {
			this.viewedView.set(dp.currentView as "date" | "month" | "year");
		}
		if (typeof dp.currentMonth === "number" && typeof dp.currentYear === "number") {
			this.viewedDate.set(new Date(dp.currentYear, dp.currentMonth, 1));
		}
	}

	public onPanelInteract(): void {
		this.syncViewedState();
		this.highlightYearRange();
	}

	public onMonthChange(): void {
		this.syncViewedState();
	}

	private highlightYearRange(): void {
		const dates = this.datesTemp();
		if (!dates?.[0] || !dates?.[1]) return;

		const startYear = dates[0].getFullYear();
		const endYear = dates[1].getFullYear();
		if (startYear >= endYear) return;

		const dp = this.datepickerRef() as any;
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

	public onCalendarClose(): void {
		const dates = this.datesTemp();
		if (!dates?.[0] || dates[1]) return;

		const { minDate, maxDate } = this.datePickerOptions();
		const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
		const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
		let selected = new Date(dates[0].getFullYear(), dates[0].getMonth(), 1);

		if (selected.getTime() < minMonth.getTime()) selected = minMonth;
		if (selected.getTime() > maxMonth.getTime()) selected = maxMonth;

		const completed: Date[] = [selected, selected];
		this.datesTemp.set(completed);
		this.dateTypeTemp.set(PeriodFilterTypeEnum.Custom);
		this.optOutServiceFilter.updateFilterTemp({ dateTypeId: PeriodFilterTypeEnum.Custom, dates: completed });
	}

	public applyPreset(typeId: PeriodFilterTypeEnum): void {
		switch (typeId) {
			case PeriodFilterTypeEnum.Last12Months:
				this.setLast12Months();
				break;
			case PeriodFilterTypeEnum.CurrentYear:
				this.setCurrentYear();
				break;
			case PeriodFilterTypeEnum.CurrentMonth:
				this.setCurrentMonth();
				break;
		}
	}

	private getDateOrDefault(index: 0 | 1, fallback: Date, dateType: PeriodFilterTypeEnum, dates: Date[] | null): Date {
		if (dateType !== PeriodFilterTypeEnum.Custom && dates && dates.length > index && dates[index]) {
			if (index === 0) {
				let start = new Date(dates[0].getFullYear(), dates[0].getMonth());
				start = new Date(Math.min(start.getTime(), fallback.getTime()));
				return start;
			} else {
				let end = new Date(dates[1].getFullYear(), dates[1].getMonth() + 1, 0);
				end = new Date(Math.max(end.getTime(), fallback.getTime()));
				return end;
			}
		}
		return fallback;
	}

	public setLast12Months(): void {
		const { maxDate } = this.datePickerOptions();
		const start = this.clampStartDate(new Date(maxDate.getFullYear(), maxDate.getMonth() - 11, 1));
		const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
		this.dateTypeTemp.set(PeriodFilterTypeEnum.Last12Months);
		this.datesTemp.set([start, end]);
		this.optOutServiceFilter.updateFilterTemp({ dateTypeId: PeriodFilterTypeEnum.Last12Months, dates: [start, end] });
	}

	public setCurrentYear(): void {
		const now = new Date();
		const start = new Date(now.getFullYear(), 0, 1);
		const end = new Date(now.getFullYear(), 11, 31);
		this.dateTypeTemp.set(PeriodFilterTypeEnum.CurrentYear);
		this.datesTemp.set([start, end]);
		this.optOutServiceFilter.updateFilterTemp({ dateTypeId: PeriodFilterTypeEnum.CurrentYear, dates: [start, end] });
	}

	public setCurrentMonth(): void {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		this.dateTypeTemp.set(PeriodFilterTypeEnum.CurrentMonth);
		this.datesTemp.set([start, end]);
		this.optOutServiceFilter.updateFilterTemp({ dateTypeId: PeriodFilterTypeEnum.CurrentMonth, dates: [start, end] });
	}

	private clampStartDate(start: Date): Date {
		const { minDate } = this.datePickerOptions();
		return start < minDate ? minDate : start;
	}

	public OnDateRangeChange(range: Date[]): void {
		const isComplete = range?.length >= 2 && !!range[0] && !!range[1];
		this.dateTypeTemp.set(PeriodFilterTypeEnum.Custom);
		this.datesTemp.set(range);
		if (isComplete) {
			this.optOutServiceFilter.updateFilterTemp({ dateTypeId: PeriodFilterTypeEnum.Custom, dates: range });
		}
	}

	public applyFilters(): void {
		const filter = this.optOutServiceFilter.filterTemp();
		if (!this.validateFilters(filter)) return;
		this.optOutServiceFilter.applyFilters();
	}

	public resetFilters(): void {
		this.setCurrentYear();
		this.optOutServiceFilter.resetToInitial();
	}

	private restoreFilterTemp(): void {
		this.optOutServiceFilter.restoreFilterTemp();
		const applied = this.optOutServiceFilter.filter();
		this.datesTemp.set(applied.dates);
		this.dateTypeTemp.set(applied.dateTypeId);
	}

	private validateFilters(filter: OptOutFilterModel): boolean {
		let isValid = true;
		const filters = this.listFilters();

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
				field: filter.bankId,
				message: `${messageSelect} ${this.termPipe.transform("ENTITY", this.globalTermService.languageCode)}.`,
				skip: filters?.clients?.length === 0,
				isValid: (v: number[]) => v?.length > 0,
			},
			{
				field: filter.brandId,
				message: `${messageSelect} ${this.termPipe.transform("BRAND", this.globalTermService.languageCode)}.`,
				isValid: (v: number[]) => v?.length > 0,
			},
			{
				field: filter.businessId,
				message: `${messageSelect} ${this.termPipe.transform("BUSINESS", this.globalTermService.languageCode)}.`,
				isValid: (v: number[]) => v?.length > 0,
			},
			{
				field: filter.dates,
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

	public selectedBankLabel = computed(() => {
		const selected = this.filterTemp().bankId ?? [];
		const clients = this.listFilters().clients ?? [];
		if (selected.length === 0) return "";
		if (selected.length === clients.length && clients.length > 1) return this.termPipe.transform("ALL_INSTITUTIONS", this.globalTermService.languageCode);
		return this.buildLabel(selected, id => clients.find(x => x.bankId === id)?.bankName, "SELECTED_INSTITUTIONS");
	});

	public selectedBrandLabel = computed(() => {
		const selected = this.filterTemp().brandId ?? [];
		const brands = this.listFilters().brands ?? [];
		if (selected.length === 0) return "";
		if (selected.length === brands.length && brands.length > 1) return this.termPipe.transform("ALL_BRANDS", this.globalTermService.languageCode);
		return this.buildLabel(selected, id => brands.find(x => x.id === id)?.name, "SELECTED_BRANDS");
	});

	public selectedBusinessLabel = computed(() => {
		const selected = this.filterTemp().businessId ?? [];
		const business = this.listFilters().business ?? [];
		if (selected.length === 0) return "";
		if (selected.length === business.length && business.length > 1) return this.termPipe.transform("ALL_BUSINESSES", this.globalTermService.languageCode);
		return this.buildLabel(selected, id => business.find(x => x.id === id)?.name, "SELECTED_BUSINESSES");
	});

	public onBankChange(ids: number[]): void {
		this.optOutServiceFilter.updateFilterTemp({ bankId: ids });
	}

	public onBrandChange(ids: number[]): void {
		this.optOutServiceFilter.updateFilterTemp({ brandId: ids });
	}

	public onBusinessChange(ids: number[]): void {
		this.optOutServiceFilter.updateFilterTemp({ businessId: ids });
	}

	private buildLabel(selectedIds: number[], getName: (id: number) => string | undefined, typeTerm?: string): string {
		if (selectedIds.length === 0) return "";
		if (selectedIds.length === 1) return getName(selectedIds[0]) ?? "";
		const selected = `${selectedIds.length}`;
		return typeTerm ? `${selected} ${this.termPipe.transform(typeTerm, this.globalTermService.languageCode)}` : selected;
	}
}

function isMonthBefore(a: Date, b: Date): boolean {
	return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

function decadeStart(year: number): number {
	return year - (year % 10);
}
