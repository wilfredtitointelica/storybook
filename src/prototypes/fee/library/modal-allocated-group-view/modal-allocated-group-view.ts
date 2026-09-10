import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { FormatAmountPipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { FeeLibraryFilter } from "../DTO/request";
import { FeeGroupView } from "../DTO/response";
import { LibraryService } from "../library.service";
import { CommonService } from "../domain/common.service";
import { MessageService } from "primeng/api";
import { LIBRARY_TERM } from "../common/constants";
import { CommonGlobalService } from "../../common/services/common.service";

interface GroupViewRow {
	id: number;
	clientName: string;
	mastercardIssuer: number;
	mastercardAcqPos: number;
	mastercardAcqCash: number;
	mastercardTotal: number;
	visaIssuer: number;
	visaAcqPos: number;
	visaAcqCash: number;
	visaTotal: number;
	amexIssuer: number;
	amexAcqPos: number;
	amexAcqCash: number;
	amexTotal: number;
	total: number;
	totalPercent: number;
}

@Component({
	selector: "fee-modal-allocated-group-view",
	imports: [CommonModule, ButtonModule, SkeletonModule, TableModule, FormatAmountPipe, StatusStateComponent, TooltipModule],
	templateUrl: "./modal-allocated-group-view.html",
	styleUrls: ["./modal-allocated-group-view.css"],
})
export class ModalAllocatedGroupView {
	private readonly libraryService = inject(LibraryService);
	private readonly commonService = inject(CommonService);
	private readonly messageService = inject(MessageService);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly libraryTerm = LIBRARY_TERM;
	readonly StatusStateEnum = StatusStateEnum;

	filter = input<FeeLibraryFilter | null>(null);
	visible = input(false);
	crncyCode = input("");

	readonly listData = signal<GroupViewRow[]>([]);
	readonly isLoading = signal(true);
	readonly isDownloading = signal(false);
	readonly hasError = signal(false);

	readonly cols = computed(() => {
		const rows = this.listData();
		const any = (vals: number[]) => vals.some(v => v !== 0);

		const mcIssuer = any(rows.map(r => r.mastercardIssuer));
		const mcAcqPos = any(rows.map(r => r.mastercardAcqPos));
		const mcAcqCash = any(rows.map(r => r.mastercardAcqCash));
		const mc = any(rows.map(r => r.mastercardTotal));

		const vIssuer = any(rows.map(r => r.visaIssuer));
		const vAcqPos = any(rows.map(r => r.visaAcqPos));
		const vAcqCash = any(rows.map(r => r.visaAcqCash));
		const visa = any(rows.map(r => r.visaTotal));

		const aIssuer = any(rows.map(r => r.amexIssuer));
		const aAcqPos = any(rows.map(r => r.amexAcqPos));
		const aAcqCash = any(rows.map(r => r.amexAcqCash));
		const amex = any(rows.map(r => r.amexTotal));

		return {
			mastercard: mc,
			mastercardIssuer: mc && mcIssuer,
			mastercardAcqPos: mc && mcAcqPos,
			mastercardAcqCash: mc && mcAcqCash,
			mastercardColspan: mc ? 1 + (mcIssuer ? 1 : 0) + (mcAcqPos ? 1 : 0) + (mcAcqCash ? 1 : 0) : 0,
			visa,
			visaIssuer: visa && vIssuer,
			visaAcqPos: visa && vAcqPos,
			visaAcqCash: visa && vAcqCash,
			visaColspan: visa ? 1 + (vIssuer ? 1 : 0) + (vAcqPos ? 1 : 0) + (vAcqCash ? 1 : 0) : 0,
			amex,
			amexIssuer: amex && aIssuer,
			amexAcqPos: amex && aAcqPos,
			amexAcqCash: amex && aAcqCash,
			amexColspan: amex ? 1 + (aIssuer ? 1 : 0) + (aAcqPos ? 1 : 0) + (aAcqCash ? 1 : 0) : 0,
		};
	});

	readonly totals = computed(() => {
		const rows = this.listData();
		return {
			mastercardIssuer: rows.reduce((s, r) => s + r.mastercardIssuer, 0),
			mastercardAcqPos: rows.reduce((s, r) => s + r.mastercardAcqPos, 0),
			mastercardAcqCash: rows.reduce((s, r) => s + r.mastercardAcqCash, 0),
			mastercardTotal: rows.reduce((s, r) => s + r.mastercardTotal, 0),
			visaIssuer: rows.reduce((s, r) => s + r.visaIssuer, 0),
			visaAcqPos: rows.reduce((s, r) => s + r.visaAcqPos, 0),
			visaAcqCash: rows.reduce((s, r) => s + r.visaAcqCash, 0),
			visaTotal: rows.reduce((s, r) => s + r.visaTotal, 0),
			amexIssuer: rows.reduce((s, r) => s + r.amexIssuer, 0),
			amexAcqPos: rows.reduce((s, r) => s + r.amexAcqPos, 0),
			amexAcqCash: rows.reduce((s, r) => s + r.amexAcqCash, 0),
			amexTotal: rows.reduce((s, r) => s + r.amexTotal, 0),
			total: rows.reduce((s, r) => s + r.total, 0),
		};
	});

	readonly frozenTotals = computed(() => [this.totals()]);

	get currencyLabel(): string {
		const code = this.crncyCode()?.trim();
		const currencyLabel = this.commonGlobalService.termText(this.libraryTerm.CURRENCY);
		return code ? `${currencyLabel}: ${code}` : currencyLabel;
	}

	constructor() {
		effect(() => {
			const visible = this.visible();
			const filter = this.filter();
			if (visible && filter) {
				this.loadData(filter);
			}
		});
	}

	get isEmptyState(): boolean {
		return !this.isLoading() && (this.hasError() || this.listData().length === 0);
	}

	get exportTooltip(): string {
		return !this.isLoading() && this.listData().length === 0 ? this.commonGlobalService.termText(this.libraryTerm.NO_DATA_TO_EXPORT) : "";
	}

	get isSystemErrorState(): boolean {
		return !this.isLoading() && this.hasError();
	}

	get isNoDataState(): boolean {
		return !this.isLoading() && !this.hasError() && this.listData().length === 0;
	}

	reloadPage(): void {
		window.location.reload();
	}

	private loadData(filter: FeeLibraryFilter): void {
		this.isLoading.set(true);
		this.hasError.set(false);
		this.libraryService.getFeeGroupView(filter).subscribe({
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

	private mapRow(r: FeeGroupView): GroupViewRow {
		return {
			id: r.id,
			clientName: r.name,
			mastercardIssuer: r.mastercardIssuer,
			mastercardAcqPos: r.mastercardAcqPos,
			mastercardAcqCash: r.mastercardAcqCash,
			mastercardTotal: r.mastercardTotal,
			visaIssuer: r.visaIssuer,
			visaAcqPos: r.visaAcqPos,
			visaAcqCash: r.visaAcqCash,
			visaTotal: r.visaTotal,
			amexIssuer: r.amexIssuer,
			amexAcqPos: r.amexAcqPos,
			amexAcqCash: r.amexAcqCash,
			amexTotal: r.amexTotal,
			total: r.total,
			totalPercent: r.totalPercent,
		};
	}

	downloadExcel(): void {
		const filter = this.filter();
		if (!filter || this.isDownloading()) return;

		this.isDownloading.set(true);
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.libraryTerm.PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.libraryTerm.DOWNLOAD_START_FILE),
		});
		this.libraryService.downloadFeeGroupView(filter).subscribe({
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
		return this.commonService.buildExportFileName(this.commonGlobalService.termText(this.libraryTerm.MODULE_EXPORT), this.commonGlobalService.termText(this.libraryTerm.NAME_GROUP_VIEW_EXPORT));
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
