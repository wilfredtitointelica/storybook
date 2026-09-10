import { CommonModule, DatePipe } from "@angular/common";
import { Component, effect, inject, input, signal, viewChild } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { ColumnComponent, FormatAmountPipe, RowResumenComponent, TableComponent, TruncatePipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { FeeLibraryFilter } from "../DTO/request";
import { FeeExcluded } from "../DTO/response";
import { LibraryService } from "../library.service";
import { CommonService } from "../domain/common.service";
import { MessageService } from "primeng/api";
import { LIBRARY_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";

interface FeeExcludedRow {
	id: number;
	date: string;
	brandCode: string;
	brandDescription: string;
	clientName: string;
	feeCode: string;
	feeName: string;
	category: string;
	feeAmount: number;
}

@Component({
	selector: "fee-modal-allocated-excluded",
	imports: [CommonModule, ButtonModule, SkeletonModule, TooltipModule, TableComponent, ColumnComponent, RowResumenComponent, TruncatePipe, FormatAmountPipe, StatusStateComponent],
	templateUrl: "./modal-allocated-excluded.html",
	styleUrl: "./modal-allocated-excluded.css",
	providers: [DatePipe],
})
export class ModalAllocatedExcluded {
	private readonly libraryService = inject(LibraryService);
	readonly commonService = inject(CommonService);
	private readonly messageService = inject(MessageService);
	private readonly datePipe = inject(DatePipe);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly libraryTerm = LIBRARY_TERM;
	readonly StatusStateEnum = StatusStateEnum;

	filter = input<FeeLibraryFilter | null>(null);
	visible = input(false);
	crncyCode = input("");

	readonly isLoading = signal(true);
	readonly isDownloading = signal(false);
	readonly hasError = signal(false);
	readonly listData = signal<FeeExcludedRow[]>([]);
	readonly showTable = signal(true);
	readonly itltable = viewChild<TableComponent<FeeExcludedRow>>("itltable");
	searchText = "";

	constructor() {
		effect(() => {
			const visible = this.visible();
			const filter = this.filter();
			if (visible && filter) {
				this.loadData(filter);
			}
		});
	}

	private loadData(filter: FeeLibraryFilter): void {
		this.isLoading.set(true);
		this.hasError.set(false);
		this.libraryService.getFeeExcluded(filter).subscribe({
			next: data => {
				this.listData.set(data.map(r => this.mapRow(r)));
				this.isLoading.set(false);
			},
			error: () => {
				this.hasError.set(true);
				this.listData.set([]);
				this.isLoading.set(false);
			},
		});
	}

	get exportTooltip(): string {
		return !this.isLoading() && this.listData().length === 0 ? this.commonGlobalService.termText(this.libraryTerm.NO_DATA_TO_EXPORT) : "";
	}

	get isEmptyState(): boolean {
		return !this.isLoading() && (this.hasError() || this.listData().length === 0 || this.filteredListData().length === 0);
	}

	get isSystemErrorState(): boolean {
		return !this.isLoading() && this.hasError();
	}

	get isNoMatchesState(): boolean {
		return !this.isLoading() && !this.hasError() && this.listData().length > 0 && this.filteredListData().length === 0 && this.searchText.length > 0;
	}

	get isNoDataState(): boolean {
		return !this.isLoading() && !this.hasError() && this.listData().length === 0;
	}

	reloadPage(): void {
		window.location.reload();
	}

	private mapRow(r: FeeExcluded): FeeExcludedRow {
		return {
			id: r.id,
			date: r.lastBillingDate ?? "",
			brandCode: r.brandCode ?? "",
			brandDescription: r.brandDescription ?? r.brandCode ?? "-",
			clientName: r.clientName ?? "-",
			feeCode: r.feeCode ?? "-",
			feeName: r.feeName ?? "-",
			category: r.category ?? "-",
			feeAmount: r.feeAmount,
		};
	}

	readonly filteredListData = signal<FeeExcludedRow[]>([]);

	get totalFeeAmount(): number {
		const data = this.filteredListData().length > 0 ? this.filteredListData() : this.listData();
		return data.reduce((sum, row) => sum + (row.feeAmount ?? 0), 0);
	}

	onFilteredDataChange(data: FeeExcludedRow[]): void {
		this.filteredListData.set(data);
	}

	onSearchChange(event: any): void {
		this.searchText = event?.searchText?.trim() ?? "";
	}

	get totalAmountColumnIndex(): number {
		return this.showClientColumn ? 6 : 5;
	}

	downloadExcel(): void {
		const filter = this.filter();
		if (!filter || this.isDownloading()) return;

		const dataToExport = this.filteredListData().length > 0 ? this.filteredListData() : this.listData();
		this.isDownloading.set(true);
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.libraryTerm.PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.libraryTerm.DOWNLOAD_START_FILE),
		});
		this.libraryService
			.exportExcludedFromList({
				items: dataToExport,
				startDate: filter.startDate,
				endDate: filter.endDate,
				bankId: filter.bankId,
				groupId: filter.groupId,
				flagGroup: filter.flagGroup ?? false,
				searchText: this.searchText || undefined,
			})
			.subscribe({
				next: blob => {
					try {
						this.commonService.downloadBlob(blob, this.buildExportFileName());
						this.messageService.add({
							severity: "success",
							icon: "icon icon-success",
							summary: this.commonGlobalService.termText(this.libraryTerm.FILE_DOWNLOAD_SUCCESS),
							detail: this.commonGlobalService.termText(this.libraryTerm.FILE_DOWNLOAD_DEVICE),
						});
					} catch {
						this.showExportError();
					}
					this.isDownloading.set(false);
				},
				error: () => {
					this.showExportError();
					this.isDownloading.set(false);
				},
			});
	}

	private buildExportFileName(): string {
		return this.commonService.buildExportFileName(this.commonGlobalService.termText(this.libraryTerm.MODULE_EXPORT), this.commonGlobalService.termText(this.libraryTerm.NAME_EXCLUDED_EXPORT));
	}

	get amountHeader(): string {
		const code = this.crncyCode()?.trim();
		const amountInLabel = this.commonGlobalService.termText(this.libraryTerm.AMOUNT_IN);
		return code ? `${amountInLabel} ${code}` : this.commonGlobalService.termText(this.libraryTerm.AMOUNT);
	}

	get searchFields(): string[] {
		const fields = [this.commonGlobalService.termText(this.libraryTerm.EXCLUDED_DATE), this.commonGlobalService.termText(this.libraryTerm.BRAND)];

		if (this.showClientColumn) {
			fields.push(this.commonGlobalService.termText(this.libraryTerm.INSTITUTION));
		}

		fields.push(
			this.commonGlobalService.termText(this.libraryTerm.CATEGORY),
			this.commonGlobalService.termText(this.libraryTerm.FEE_CODE),
			this.commonGlobalService.termText(this.libraryTerm.FEE_NAME),
			this.amountHeader
		);

		return fields;
	}

	get showClientColumn(): boolean {
		const filter = this.filter();
		if (!filter?.flagGroup) {
			return false;
		}

		if (!filter.bankId || filter.bankId === "-1") {
			return true;
		}

		return (
			filter.bankId
				.split("|")
				.map(value => Number(value))
				.filter(value => !Number.isNaN(value)).length > 1
		);
	}

	private showExportError(): void {
		this.messageService.add({
			severity: "error",
			icon: "icon icon-alert",
			summary: this.commonGlobalService.termText(this.libraryTerm.FILE_FAILED_DOWNLOAD),
			detail: this.commonGlobalService.termText(this.libraryTerm.FILE_CONTACT_SUPPORT),
		});
	}
}
