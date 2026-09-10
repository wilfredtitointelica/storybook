import { Component, computed, effect, inject, input, output, signal, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { GlobalTermService } from "intelica-library-base";
import { Button } from "primeng/button";
import { DatePickerModule } from "primeng/datepicker";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { Skeleton } from "primeng/skeleton";
import { DatePeriodEnum } from "../common/enums";
import { FEE_DETAIL_TERM } from "../common/constants";
import { FeeDetailFilterOutput } from "../dto/fee-detail-commands.dto";
import { FeeDetailInfoResponse } from "../dto/fee-detail.dto";
import { DATE_PERIOD, DatePeriod, DatepickerRange, DateRangeOutput } from "../../common/datepicker-range/datepicker-range";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-header",
	standalone: true,
	imports: [FormsModule, Button, DatePickerModule, MultiSelectModule, SelectModule, Skeleton, DatepickerRange],
	templateUrl: "./header.html",
})
export class HeaderComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	public readonly DatePeriodEnum = DatePeriodEnum;

	public loading = input<boolean>(false);
	public busy = input<boolean>(false);
	public overviewData = input<FeeDetailInfoResponse | null>(null);
	public isSinglePeriod = input<boolean>(false);
	public isNewFee = input<boolean>(false);
	public isGroupProfile = input<boolean>(false);
	public selectedBankId = input<number>(-1);
	// Rango/period que llegan del modulo origen (por query params) para reflejarlos en el datepicker.
	public incomingRange = input<{ start: Date; end: Date } | null>(null);
	public incomingPeriod = input<DatePeriodEnum | null>(null);

	public apply = output<FeeDetailFilterOutput>();
	public reset = output<void>();
	public clientChanged = output<number>();

	public clientOptions = computed(() => this.overviewData()?.associatedBanks ?? []);
	public showClientSelect = computed<boolean>(() => this.isGroupProfile() || this.clientOptions().length > 1);

	public brandOptions = computed(() => {
		const d = this.overviewData();
		return d && d.brandId ? [{ id: d.brandId, name: d.brand }] : [];
	});
	public selectedBrandIds = computed<number[]>(() => {
		const d = this.overviewData();
		return d && d.brandId ? [d.brandId] : [];
	});
	public businessOptions = computed(() => {
		const d = this.overviewData();
		return d && d.businessId ? [{ id: d.businessId, name: d.business }] : [];
	});
	public selectedBusinessIds = computed<number[]>(() => {
		const d = this.overviewData();
		return d && d.businessId ? [d.businessId] : [];
	});

	public dateRange = signal<Date[] | null>(null);
	public selectedPeriod = signal<DatePeriodEnum>(DatePeriodEnum.Last12Months);
	private datepicker = viewChild(DatepickerRange);

	public isLast12Active = computed(() => this.selectedPeriod() === DatePeriodEnum.Last12Months);
	public isCurrentYearActive = computed(() => this.selectedPeriod() === DatePeriodEnum.CurrentYear);
	public isCurrentMonthActive = computed(() => this.selectedPeriod() === DatePeriodEnum.CurrentMonth);

	public minDate = computed<Date | null>(() => this.parseIso(this.overviewData()?.minDate));
	public maxDate = computed<Date | null>(() => this.parseIso(this.overviewData()?.maxDate));

	// Period para el datepicker hijo (mismos valores string que DatePeriod del componente compartido).
	public childInitPeriod = computed<DatePeriod>(() => (this.incomingPeriod() ?? DatePeriodEnum.Last12Months) as unknown as DatePeriod);
	private hasAppliedIncoming = false;

	isReadonly = true;

	constructor() {
		this.applyPreset(DatePeriodEnum.Last12Months);

		// Preset por defecto al cargar overview — se omite si llego un rango/period del modulo origen.
		effect(() => {
			if (!this.overviewData()) return;
			if (this.incomingRange() || this.incomingPeriod()) return;
			this.applyPreset(this.isNewFee() ? DatePeriodEnum.CurrentMonth : DatePeriodEnum.Last12Months);
		});

		// One-shot: refleja el rango/period entrante en el estado del header (para que Apply quede consistente).
		effect(() => {
			if (this.hasAppliedIncoming) return;
			const range = this.incomingRange();
			const period = this.incomingPeriod();
			if (!range && !period) return;
			this.hasAppliedIncoming = true;
			if (range) {
				this.dateRange.set([range.start, range.end]);
				this.selectedPeriod.set(DatePeriodEnum.Custom);
			} else if (period) {
				this.applyPreset(period);
			}
		});

		effect(() => {
			const min = this.minDate();
			const max = this.maxDate();
			const period = this.selectedPeriod();
			if (!min && !max) return;
			if (period === DatePeriodEnum.Custom) return;
			this.applyPreset(period);
		});
	}

	public applyPreset(period: DatePeriodEnum): void {
		const max = this.maxDate();
		if (period === DatePeriodEnum.CurrentMonth) {
			const today = new Date();
			const anchorEnd = max && max < today ? max : today;
			const anchorStart = new Date(anchorEnd.getFullYear(), anchorEnd.getMonth(), 1);
			this.dateRange.set([anchorStart, anchorEnd]);
			this.selectedPeriod.set(period);
			return;
		}
		let [start, end] = this.computeRange(period);
		const min = this.minDate();
		if (max && end > max) end = max;
		if (min && start < min) start = min;
		if (max && start > max) start = max;
		if (min && end < min) end = min;
		this.dateRange.set([start, end]);
		this.selectedPeriod.set(period);
	}

	public onApply(): void {
		const range = this.dateRange();
		if (!range || range.length === 0 || !range[0]) return;
		const [start, end] = range;
		this.apply.emit({
			period: this.selectedPeriod(),
			startDate: this.formatDate(start),
			endDate: this.formatDate(end ?? start),
		});
	}

	public onReset(): void {
		this.datepicker()?.applyPreset(DATE_PERIOD.Last12Months);
		this.reset.emit();
	}

	public onClientChanged(bankId: number): void {
		if (bankId === this.selectedBankId()) return;
		this.clientChanged.emit(bankId);
	}

	public onNewDateChanged(output: DateRangeOutput): void {
		this.dateRange.set([output.start, output.end]);
		this.selectedPeriod.set(output.period as unknown as DatePeriodEnum);
	}

	private computeRange(period: DatePeriodEnum): [Date, Date] {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		switch (period) {
			case DatePeriodEnum.Last12Months: {
				const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
				return [start, today];
			}
			case DatePeriodEnum.CurrentYear: {
				const start = new Date(today.getFullYear(), 0, 1);
				return [start, today];
			}
			case DatePeriodEnum.CurrentMonth: {
				const start = new Date(today.getFullYear(), today.getMonth(), 1);
				return [start, today];
			}
			default:
				return [today, today];
		}
	}

	private formatDate(d: Date): string {
		return this.toIso(d);
	}

	private toIso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	private parseIso(iso: string | undefined | null): Date | null {
		if (!iso) return null;
		const [y, m, d] = iso.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}
}
