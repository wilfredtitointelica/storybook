import { Component, DestroyRef, effect, inject, input, model, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MessageService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { GlobalTermService } from "intelica-library-base";
import { TableComponent, ColumnComponent } from "intelica-library-project";
import { FeeReferenceItem } from "../dto/fee-detail.dto";
import { FEE_DETAIL_TERM } from "../common/constants";
import { FeeDetailService } from "../fee-detail.service";
import { MessageModule } from "primeng/message";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-modal-reference",
	standalone: true,
	imports: [CommonModule, BadgeModule, ButtonModule, Skeleton, TooltipModule, MessageModule, TableComponent, ColumnComponent],
	templateUrl: "./modal-reference.html",
})
export class ModalReferenceComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;

	private readonly service = inject(FeeDetailService);
	private readonly sanitizer = inject(DomSanitizer);
	private readonly messageService = inject(MessageService);
	private readonly destroyRef = inject(DestroyRef);

	public feeId = input<string>("");
	public visible = model<boolean>(false);

	public items = signal<FeeReferenceItem[]>([]);
	public isLoading = signal<boolean>(false);
	public hasError = signal<boolean>(false);

	public selectedReference = signal<FeeReferenceItem | null>(null);
	public showDetail = signal<boolean>(false);
	public isLoadingPdf = signal<boolean>(false);
	public pdfSafeUrl = signal<SafeResourceUrl | null>(null);
	private pdfBlobUrl: string | null = null;
	private pdfBlob: Blob | null = null;

	constructor() {
		effect(() => {
			const id = this.feeId();
			const isVisible = this.visible();
			if (!isVisible || !id) return;
			this.loadReferences(id);
		});

		this.destroyRef.onDestroy(() => this.revokePdfUrl());
	}

	public onViewReference(row: FeeReferenceItem): void {
		this.selectedReference.set(row);
		this.showDetail.set(true);
		this.isLoadingPdf.set(true);
		this.revokePdfUrl();
		this.service
			.downloadReferencePdf(row.path)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: blob => {
					this.pdfBlob = blob;
					this.pdfBlobUrl = URL.createObjectURL(blob);
					const viewerUrl = `${this.pdfBlobUrl}#navpanes=0&toolbar=0`;
					this.pdfSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl));
					this.isLoadingPdf.set(false);
				},
				error: () => {
					this.isLoadingPdf.set(false);
					this.showPdfError();
				},
			});
	}

	public onBack(): void {
		this.showDetail.set(false);
		this.selectedReference.set(null);
		this.revokePdfUrl();
	}

	public onDownloadPdf(): void {
		const row = this.selectedReference();
		if (!row || !this.pdfBlob) return;
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.feeDetailTerm.PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.feeDetailTerm.DOWNLOAD_START_FILE),
		});
		try {
			const url = URL.createObjectURL(this.pdfBlob);
			const a = document.createElement("a");
			a.href = url;
			a.download = this.buildPdfFileName(row);
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			this.messageService.add({
				severity: "success",
				icon: "icon icon-success",
				summary: this.commonGlobalService.termText(this.feeDetailTerm.FILE_DOWNLOAD_SUCCESS),
				detail: this.commonGlobalService.termText(this.feeDetailTerm.FILE_DOWNLOAD_DEVICE),
			});
		} catch {
			this.showPdfError();
		}
	}

	private loadReferences(feeId: string): void {
		this.isLoading.set(true);
		this.hasError.set(false);
		this.showDetail.set(false);
		this.selectedReference.set(null);
		this.revokePdfUrl();
		this.service
			.getReferences(feeId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: result => {
					this.items.set(result);
					this.isLoading.set(false);
				},
				error: () => {
					this.items.set([]);
					this.isLoading.set(false);
					this.hasError.set(true);
				},
			});
	}

	private revokePdfUrl(): void {
		if (this.pdfBlobUrl) {
			URL.revokeObjectURL(this.pdfBlobUrl);
			this.pdfBlobUrl = null;
		}
		this.pdfBlob = null;
		this.pdfSafeUrl.set(null);
	}

	private buildPdfFileName(row: FeeReferenceItem): string {
		const base = row.documentCode || row.fileName || "Reference";
		const safe = base.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80);
		return `${safe}.pdf`;
	}

	private showPdfError(): void {
		this.messageService.add({
			severity: "error",
			icon: "icon icon-alert",
			summary: this.commonGlobalService.termText(this.feeDetailTerm.FILE_FAILED_DOWNLOAD),
			detail: this.commonGlobalService.termText(this.feeDetailTerm.FILE_CONTACT_SUPPORT),
		});
	}
}
