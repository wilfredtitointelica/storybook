import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild, ViewEncapsulation } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePicker, DatePickerModule } from "primeng/datepicker";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { PrimeNG } from "primeng/config";
import { CommonGlobalService } from "../services/common.service";
import { COMMON_TERM } from "../constants/term";

export const DATE_PERIOD = {
	Last12Months: "Last12Months",
	CurrentYear: "CurrentYear",
	CurrentMonth: "CurrentMonth",
	Custom: "Custom",
} as const;
export type DatePeriod = (typeof DATE_PERIOD)[keyof typeof DATE_PERIOD];

export interface DateRangeOutput {
	start: Date;
	end: Date;
	period: DatePeriod;
	label: string;
}

interface PresetConfig {
	period: DatePeriod;
	termKey: string;
	compute: (today: Date) => [Date, Date];
}

interface PresetState {
	period: DatePeriod;
	label: string;
	active: boolean;
	disabled: boolean;
}

type DatePickerView = "date" | "month" | "year";

interface DatePickerInternals {
	currentMonth?: number;
	currentYear?: number;
	currentView?: DatePickerView;
}

const PRESETS: readonly PresetConfig[] = [
	{
		period: DATE_PERIOD.Last12Months,
		termKey: COMMON_TERM.LBL_LAST_12,
		compute: today => [new Date(today.getFullYear(), today.getMonth() - 11, 1), today],
	},
	{
		period: DATE_PERIOD.CurrentYear,
		termKey: COMMON_TERM.LBL_CURRENT_YEAR,
		compute: today => [new Date(today.getFullYear(), 0, 1), today],
	},
	{
		period: DATE_PERIOD.CurrentMonth,
		termKey: COMMON_TERM.LBL_CURRENT_MONTH,
		compute: today => [new Date(today.getFullYear(), today.getMonth(), 1), today],
	},
];

const DEFAULT_MONTHS_SHORT = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function startOfDay(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function clampDate(d: Date, min: Date | null, max: Date, disabledDates: Date[] = []): Date {
	let result = new Date(d);
	if (result > max) result = new Date(max);
	if (min && result < min) result = new Date(min);
	while (disabledDates.some(x => isSameDate(x, result))) {
		result.setDate(result.getDate() + 1);
		if (result > max) {
			result = new Date(max);
			while (disabledDates.some(x => isSameDate(x, result))) {
				result.setDate(result.getDate() - 1);

				if (min && result < min) {
					throw new Error("No valid date available.");
				}
			}
			break;
		}
	}
	return result;
}

function isSameDate(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isMonthBefore(a: Date, b: Date): boolean {
	return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

function decadeStart(year: number): number {
	return year - (year % 10);
}

function rangesOverlap(start: Date, end: Date, min: Date | null, max: Date): boolean {
	if (start > max) return false;
	if (min && end < min) return false;
	return true;
}

@Component({
	selector: "fee-datepicker-range",
	standalone: true,
	imports: [FormsModule, DatePickerModule, ButtonModule, TooltipModule],
	templateUrl: "./datepicker-range.html",
	encapsulation: ViewEncapsulation.None,
})
export class DatepickerRange {
	readonly commonGlobalService = inject(CommonGlobalService);
	private readonly primeng = inject(PrimeNG);
	private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
	readonly term = COMMON_TERM;

	/** 'date' = selector por día (default) | 'month' = selector por mes */
	view = input<"date" | "month">("date");
	minDate = input<Date | null>(null);
	maxDate = input<Date | null>(null);
	/** Fechas específicas deshabilitadas dentro del rango (ej: días sin facturación) */
	disabledDates = input<Date[]>([]);
	disabled = input<boolean>(false);
	initPeriod = input<DatePeriod>(DATE_PERIOD.Last12Months);
	/** si es null (default) el componente se comporta igual que siempre. */
	initialRange = input<{ start: Date; end: Date } | null>(null);
	anchorToDataBounds = input<boolean>(false);

	changed = output<DateRangeOutput>();

	private datepickerRef = viewChild(DatePicker);

	protected dateFormat = computed(() => (this.view() === "month" ? "M, yy" : "dd M, yy"));

	/** Max efectivo: usa el provisto por el padre o today (vista día) / fin de mes actual (vista mes) por defecto */
	protected effectiveMaxDate = computed<Date>(() => {
		const max = this.maxDate();
		if (max) return max;
		const now = new Date();
		return this.view() === "month" ? endOfMonth(now) : startOfDay(now);
	});

	protected dateRange = signal<Date[] | null>(null);
	protected selectedPeriod = signal<DatePeriod>(this.initPeriod());

	/** Mes visible actualmente en el calendario (para ocultar flechas de navegación cuando no hay data) */
	protected viewedDate = signal<Date>(new Date());

	protected viewedView = signal<DatePickerView>("date");

	/** Estado derivado de cada preset (label, active, disabled) — el template itera con @for */
	protected presetsState = computed<PresetState[]>(() => {
		const selected = this.selectedPeriod();
		const min = this.minDate();
		const max = this.effectiveMaxDate();
		const today = startOfDay(new Date());
		return PRESETS.map(p => {
			const [start, end] = p.compute(today);
			const available = rangesOverlap(start, end, min, max);
			return {
				period: p.period,
				label: this.commonGlobalService.termText(p.termKey),
				active: selected === p.period && available,
				disabled: !available,
			};
		});
	});

	protected canGoPrev = computed(() => {
		const min = this.minDate();
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

	protected canGoNext = computed(() => {
		const max = this.effectiveMaxDate();
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

	/** Clases reactivas para el panel del datepicker — el maquetador las estiliza globalmente */
	protected panelClasses = computed(() => {
		const classes: string[] = [];
		if (!this.canGoPrev()) classes.push("prDatapicker--noPrev");
		if (!this.canGoNext()) classes.push("prDatapicker--noNext");
		return classes.join(" ");
	});

	constructor() {
		this.setPreset(DATE_PERIOD.Last12Months);

		// Sync from initPeriod
		effect(() => {
			this.selectedPeriod.set(this.initPeriod());
		});

		// Re-capar rango cuando llegan los boundaries del backend
		effect(() => {
			const min = this.minDate();
			const max = this.maxDate();
			const period = this.selectedPeriod();
			if (!min && !max) return;
			if (period === DATE_PERIOD.Custom) return;
			this.setPreset(period);
		});

		// Rango controlado desde el padre (opcional): al restaurar un rango custom, lo aplica como Custom.
		// El guard `period === Custom` del effect anterior evita que los boundaries lo re-capen.
		effect(() => {
			const range = this.initialRange();
			if (!range) return;
			if (this.anchorToDataBounds()) {
				const min = this.minDate();
				const max = this.effectiveMaxDate();
				this.dateRange.set([clampDate(range.start, min, max), clampDate(range.end, min, max)]);
			} else {
				this.dateRange.set([range.start, range.end]);
			}
			this.selectedPeriod.set(DATE_PERIOD.Custom);
		});
	}

	public applyPreset(period: DatePeriod): void {
		this.setPreset(period);
		this.emitCurrent();
	}

	public onDateRangeChange(range: Date[] | null): void {
		this.dateRange.set(range);
		this.selectedPeriod.set(DATE_PERIOD.Custom);
		// Emitir solo cuando ambas fechas están seleccionadas (rango completo)
		if (!range?.[0] || !range[1]) return;
		this.emitCurrent();
	}

	/** Al cerrar el calendario: si solo se seleccionó una fecha, completar como mismo-día y emitir */
	public onCalendarClose(): void {
		const range = this.dateRange();
		if (!range?.[0] || range[1]) return;
		this.dateRange.set([range[0], range[0]]);
		this.emitCurrent();
	}

	public onCalendarShow(): void {
		this.syncViewedState();
	}

	public onMonthChange(): void {
		this.syncViewedState();
	}

	public onPanelInteract(): void {
		this.syncViewedState();
	}

	private syncViewedState(): void {
		const dp = this.datepickerRef() as unknown as DatePickerInternals | undefined;
		if (!dp) return;
		if (dp.currentView === "date" || dp.currentView === "month" || dp.currentView === "year") {
			this.viewedView.set(dp.currentView);
		}
		if (typeof dp.currentMonth === "number" && typeof dp.currentYear === "number") {
			this.viewedDate.set(new Date(dp.currentYear, dp.currentMonth, 1));
		}
		setTimeout(() => this.highlightRangeYears(), 0);
	}

	/** PrimeNG solo resalta el año enfocado en la vista de años; marcamos TODOS los años del rango. */
	private highlightRangeYears(): void {
		const range = this.dateRange();
		const start = range?.[0];
		if (!start) return;
		const end = range[1] ?? start;
		const minYear = Math.min(start.getFullYear(), end.getFullYear());
		const maxYear = Math.max(start.getFullYear(), end.getFullYear());
		const yearCells = this.host.nativeElement.querySelectorAll<HTMLElement>(".p-datepicker-year");
		yearCells.forEach(cell => {
			const year = Number(cell.textContent?.trim());
			if (!year) return;
			cell.classList.toggle("p-datepicker-year-selected", year >= minYear && year <= maxYear);
		});
	}

	public onClear(clearCallback: () => void): void {
		clearCallback();
		this.dateRange.set(null);
		this.selectedPeriod.set(DATE_PERIOD.Custom);
	}

	/** Lectura directa del rango actual — útil cuando el padre decide el momento de Apply */
	public getCurrentRange(): DateRangeOutput | null {
		const range = this.dateRange();
		if (!range?.[0]) return null;
		const start = range[0];
		const end = range[1] ?? start;
		return { start, end, period: this.selectedPeriod(), label: this.buildLabel(start, end) };
	}

	private setPreset(period: DatePeriod): void {
		const cfg = PRESETS.find(p => p.period === period);
		if (!cfg) return;
		const min = this.minDate();
		const max = this.effectiveMaxDate();
		const disabledDates = this.disabledDates();
		const today = startOfDay(new Date());
		const [start, end] = cfg.compute(today);
		if (this.anchorToDataBounds() && max && !rangesOverlap(start, end, min, max)) {
			const fallbackStart = new Date(max.getFullYear(), max.getMonth() - 11, 1);
			this.dateRange.set([clampDate(fallbackStart, min, max, disabledDates), clampDate(max, min, max, disabledDates)]);
			this.selectedPeriod.set(DATE_PERIOD.Custom);
			return;
		}
		this.dateRange.set([clampDate(start, min, max, disabledDates), clampDate(end, min, max, disabledDates)]);
		this.selectedPeriod.set(period);
	}

	private emitCurrent(): void {
		const range = this.dateRange();
		if (!range?.[0]) return;
		const start = range[0];
		const end = range[1] ?? start;
		this.changed.emit({ start, end, period: this.selectedPeriod(), label: this.buildLabel(start, end) });
	}

	private buildLabel(start: Date, end: Date): string {
		return `${this.formatDate(start)} - ${this.formatDate(end)}`;
	}

	private formatDate(date: Date): string {
		const monthsShort = this.primeng.translation?.monthNamesShort ?? DEFAULT_MONTHS_SHORT;
		const month = (monthsShort[date.getMonth()] ?? "").toLowerCase();
		const year = date.getFullYear();
		if (this.view() === "month") return `${month}, ${year}`;
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} ${month}, ${year}`;
	}
}
