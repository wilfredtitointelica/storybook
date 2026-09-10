import { Component, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { AlertType, DateFilter, getDefaultDateRange, toIsoDate } from "./dto/alerts-filter.dto";

export interface DateRangeChange {
	startDate: string | null;
	endDate: string | null;
}

@Component({
	selector: "app-alerts-filter",
	templateUrl: "./alerts-filter.component.html",
	imports: [FormsModule, CommonModule, TermPipe, Button],
})
export class AlertsFilterComponent {
	public globalTermService = inject(GlobalTermService);
	AlertType = AlertType;
	readonly filterTypes = [
		{ type: AlertType.NewFees, termKey: "LBL_NEW_FEES" },
		{ type: AlertType.Penalties, termKey: "LBL_PENALTIES" },
		{ type: AlertType.Custom, termKey: "LBL_CUSTOM" },
	];
	activeTypes = signal<AlertType[]>([AlertType.NewFees, AlertType.Penalties, AlertType.Custom]);
	filtersChange = output<AlertType[]>();
	// --- filter: datepicker ---
	calendarView = signal<"date" | "month" | "year">("date");
	selectedDateRange = signal<Date[] | null>(
		(() => {
			const { start, end } = getDefaultDateRange();
			return [start, end];
		})()
	);
	selectedDateFilter = signal<DateFilter>(null);
	dateRangeChange = output<DateRangeChange>();

	SetDateFilter(filter: DateFilter) {
		this.selectedDateFilter.set(filter);
		const today = new Date();
		let start: Date;
		let end: Date = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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
		this.emitDateRange([start, end]);
	}

	onDateRangeChange() {
		const range = this.selectedDateRange();
		if (!range || !range[0] || !range[1]) return;
		this.selectedDateFilter.set(null);
		this.emitDateRange(range);
	}

	private emitDateRange(range: Date[]) {
		this.dateRangeChange.emit({
			startDate: toIsoDate(range[0]),
			endDate: toIsoDate(range[1]),
		});
	}

	ToggleType(type: AlertType) {
		this.activeTypes.update(types => {
			const isActive = types.includes(type);
			if (isActive && types.length === 1) return types;
			return isActive ? types.filter(t => t !== type) : [...types, type];
		});
		this.filtersChange.emit(this.activeTypes());
	}
}
