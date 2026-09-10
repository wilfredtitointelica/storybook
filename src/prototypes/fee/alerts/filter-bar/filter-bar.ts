import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// library
import { GlobalTermService, TermPipe } from "intelica-library-base";
// components primeng
import { Button } from "primeng/button";
import { MultiSelect } from "primeng/multiselect";
import { DatePicker, DatePickerModule } from "primeng/datepicker";
import { Chip } from "primeng/chip";
// interface
import { Option } from "./filter-bar.interface";
import { Skeleton } from "primeng/skeleton";
import { ClientInformationResponse } from "../../common/DTO/client-response";
import { DateFilter, getDefaultDateRange, toIsoDate } from "../alerts-filter/dto/alerts-filter.dto";
import { DateRangeChange } from "../alerts-filter/alerts-filter.component";

@Component({
	selector: "fee-filter-bar",
	imports: [FormsModule, Button, MultiSelect, DatePicker, DatePickerModule, Chip, Skeleton, TermPipe],
	templateUrl: "./filter-bar.html",
})
export class FilterBar {
	public globalTermService = inject(GlobalTermService);
	// --- inputs ---
	clientInfo = input<ClientInformationResponse | null>(null);
	isGroupProfile = input<boolean>(false);

	// --- outputs ---
	bankIdsChange = output<number[]>();
	dateRangeChange = output<DateRangeChange>();

	// --- filter: select's ---
	clientsFilterOptions = computed<Option[]>(() =>
		(this.clientInfo()?.banks ?? []).map(b => ({ key: String(b.bankId), name: b.bankName })),
	);
	selectedClientsFilter = signal<Option[] | null>(null);

	// --- filter: datepicker ---
	calendarView = signal<"date" | "month" | "year">("date");
	selectedDateRange = signal<Date[] | null>((() => {
		const { start, end } = getDefaultDateRange();
		return [start, end];
	})());
	selectedDateFilter = signal<DateFilter>(null);

	// --- applied chips: derived from current selection vs all available ---
	appliedClientChips = computed<Option[]>(() => {
		const options = this.clientsFilterOptions();
		const selected = this.selectedClientsFilter() ?? [];
		if (!options.length) return [];
		if (selected.length === options.length) return [];
		return selected;
	});

	constructor() {
		effect(() => {
			const options = this.clientsFilterOptions();
			if (options.length && this.selectedClientsFilter() === null) {
				this.selectedClientsFilter.set(options);
			}
		});
	}

	setDateFilter(filter: DateFilter) {
		this.selectedDateFilter.set(filter);
		const today = new Date();
		const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		let start: Date;

		if (filter === "last12") {
			this.calendarView.set("date");
			start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
		} else if (filter === "month") {
			this.calendarView.set("month");
			start = new Date(today.getFullYear(), today.getMonth(), 1);
		} else if (filter === "year") {
			this.calendarView.set("date");
			start = new Date(today.getFullYear(), 0, 1);
		} else {
			return;
		}

		this.selectedDateRange.set([start, end]);
	}

	onDateRangeChange() {
		const range = this.selectedDateRange();
		if (!range || !range[0] || !range[1]) return;
		this.selectedDateFilter.set(null);
	}

	ClearDate(event: Event, picker: DatePicker) {
		event.stopPropagation();
		picker.clear();
		picker.hideOverlay();
	}

	RemoveChip(option: Option) {
		const current = this.selectedClientsFilter() ?? [];
		const updated = current.filter(o => o.key !== option.key);
		this.selectedClientsFilter.set(updated);
		this.emitFilters();
	}

	ApplyFilters() {
		this.emitFilters();
	}

	ResetFilters() {
		const options = this.clientsFilterOptions();
		this.selectedClientsFilter.set(options);
		const { start, end } = getDefaultDateRange();
		this.selectedDateRange.set([start, end]);
		this.selectedDateFilter.set(null);
		this.emitFilters();
	}

	private emitFilters() {
		const selected = this.selectedClientsFilter() ?? [];
		const bankIds = selected.map(o => Number(o.key)).filter(n => !Number.isNaN(n));
		this.bankIdsChange.emit(bankIds);

		const range = this.selectedDateRange();
		this.dateRangeChange.emit({
			startDate: range?.[0] ? toIsoDate(range[0]) : null,
			endDate: range?.[1] ? toIsoDate(range[1]) : null,
		});
	}
}
