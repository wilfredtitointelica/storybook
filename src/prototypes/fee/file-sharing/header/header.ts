import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, Output, viewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { MultiSelect } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { DialogModule } from "primeng/dialog";
import { TabsModule } from "primeng/tabs";
import { CheckboxModule } from "primeng/checkbox";
import { PrimeNG } from "primeng/config";
import { FileSharingFilterRequest } from "../DTO/request";
import { FileCategoryResponse, PeriodFilterResponse } from "../DTO/response";
import { CommonService } from "../domain/common.service";
import { ModalAdvancedFilter } from "../modal-advanced-filter/modal-advanced-filter";
import { ClientBankResponse } from "../../common/DTO/client-response";
import { DATE_PERIOD, DatePeriod, DatepickerRange } from "../../common/datepicker-range/datepicker-range";
import { GlobalTermService, TermPipe } from "intelica-library-base";
@Component({
	selector: "fee-header",
	imports: [ButtonModule, CommonModule, FormsModule, SkeletonModule, TagModule, SelectModule, DialogModule, TabsModule, CheckboxModule, ModalAdvancedFilter, MultiSelect, TermPipe, DatepickerRange],
	templateUrl: "./header.html",
	styleUrl: "./header.css",
})
export class Header {
	@Output() openUploadPanel = new EventEmitter<void>();

	@Input() fileSharingFilteRequest: FileSharingFilterRequest = {} as FileSharingFilterRequest;
	@Input() isFileDropVisible = false;
	@Input() ListPeriod: PeriodFilterResponse[] = [];
	@Input() ListCategory: FileCategoryResponse[] = [];
	@Input() clientOptions: ClientBankResponse[] = [];
	@Input() loading = false;
	@Input() showOptionGroup: boolean = false;
	@Output() onClickApplyFilter: EventEmitter<FileSharingFilterRequest> = new EventEmitter();
	@Input() minDate?: Date;
	@Input() maxDate?: Date;
	private datepicker = viewChild(DatepickerRange);
	visibleLg = false;
	categorySelectedVisual: number[] = [];
	fileSharingFilteRequestTemp: FileSharingFilterRequest = {} as FileSharingFilterRequest;
	descriptionSubTitle: string = "";
	selectedClientsFilterTemp: ClientBankResponse[] = [];
	appliedClientsFilter: ClientBankResponse[] = [];
	private readonly messageService = inject(MessageService);
	private readonly primeNg = inject(PrimeNG);
	readonly GlobalTermService = inject(GlobalTermService);
	// skeleton
	private readonly commonFileSharingService = inject(CommonService);
	constructor(private readonly termPipe: TermPipe) {}
	ngOnInit() {
		this.applyDatePickerTranslation();
	}
	ngOnChanges(changes: any): void {
		this.applyDatePickerTranslation();
		if (changes.clientOptions && this.showOptionGroup && this.appliedClientsFilter.length === 0) {
			const allClients = [...this.clientOptions];
			this.selectedClientsFilterTemp = [...allClients];
			this.appliedClientsFilter = [...allClients];
		}
		if (changes.fileSharingFilteRequest) {
			this.fileSharingFilteRequestTemp = { ...this.fileSharingFilteRequest };
			this.getDescriptionSubTitle();
		}
	}
	get clientSelectionLabel(): string {
		if (this.clientOptions.length > 0 && this.selectedClientsFilterTemp.length >= this.clientOptions.length) {
			return this.termPipe.transform("ALL_INSTITUTIONS");
		}
		return this.termPipe.transform("INSTITUTIONS_SELECTED");
	}

	applyFilters() {
		const range = this.datepicker()?.getCurrentRange();
		if (!range) {
			this.messageService.add({
				severity: "warn",
				detail: this.termPipe.transform("TXT_SELECT_RANGE_DATES"),
			});
			return;
		}
		this.fileSharingFilteRequestTemp.startDate = range.start;
		this.fileSharingFilteRequestTemp.endDate = range.end;
		this.fileSharingFilteRequestTemp.periodId = this.mapPeriodId(range.period);
		if (this.showOptionGroup) {
			const allClients = this.clientOptions;
			this.appliedClientsFilter = [...this.selectedClientsFilterTemp];
			this.fileSharingFilteRequestTemp.clientIdsSelected = this.selectedClientsFilterTemp.length === allClients.length ? allClients.map(c => c.bankId) : this.selectedClientsFilterTemp.map(c => c.bankId);
		}
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
	}

	resetFilters() {
		if (this.showOptionGroup) {
			this.selectedClientsFilterTemp = [...this.clientOptions];
			this.appliedClientsFilter = [...this.clientOptions];
			this.fileSharingFilteRequestTemp.clientIdsSelected = this.clientOptions.map(c => c.bankId);
		}
		this.datepicker()?.applyPreset(DATE_PERIOD.Last12Months);
		const range = this.datepicker()?.getCurrentRange();
		if (range) {
			this.fileSharingFilteRequestTemp.startDate = range.start;
			this.fileSharingFilteRequestTemp.endDate = range.end;
			this.fileSharingFilteRequestTemp.periodId = this.mapPeriodId(range.period);
		}
		this.fileSharingFilteRequestTemp.categorySelected = [];
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
	}
	toggleUploadPanel() {
		this.openUploadPanel.emit();
	}
	showDialog() {
		this.visibleLg = true;
	}
	get advancedFilterChipLabel(): string {
		return this.commonFileSharingService.buildAdvancedFilterChipLabel(this.fileSharingFilteRequestTemp.categorySelected, this.ListCategory);
	}
	removeAdvancedFilter() {
		this.fileSharingFilteRequestTemp.categorySelected = [];
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
	}
	// Mapea el preset del DatepickerRange compartido al periodId del backend (best-effort vía ListPeriod).
	private mapPeriodId(period: DatePeriod): number {
		const tokenByPeriod: Record<DatePeriod, string> = {
			Last12Months: "LAST12MONTHS",
			CurrentYear: "CURRENTYEAR",
			CurrentMonth: "CURRENTMONTH",
			Custom: "",
		};
		const token = tokenByPeriod[period];
		if (!token) return 0;
		const match = this.ListPeriod.find(p =>
			(p.descriptionTerm || p.description || "")
				.toUpperCase()
				.replace(/[^A-Z0-9]/g, "")
				.includes(token)
		);
		return match?.periodId ?? 0;
	}
	getDescriptionSubTitle() {
		this.descriptionSubTitle = this.commonFileSharingService.getDescriptionSubTitle(this.fileSharingFilteRequestTemp);
	}
	applyAdvancedFilter(fileSharingFilteRequestTemp: FileSharingFilterRequest) {
		this.fileSharingFilteRequestTemp = { ...fileSharingFilteRequestTemp };
		this.onClickApplyFilter.emit(this.fileSharingFilteRequestTemp);
	}
	closeDialogAdvanceFilter(close: boolean) {
		this.visibleLg = close;
	}

	private applyDatePickerTranslation() {
		this.primeNg.setTranslation(this.commonFileSharingService.getDatePickerLocale());
	}
}
