import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { FileSharingResponse } from "../DTO/response";
import { FileSizePipe } from "../../common/pipe/file-size.pipe";
import { UploadDatePartPipe } from "../../common/pipe/upload-date-part.pipe";
import { StatusStateComponent, StatusStateEnum, TableComponent, ColumnComponent } from "intelica-library-project";
import { GlobalTermService, TermPipe, AlertService, AlertType } from "intelica-library-base";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import moment from "moment";
import { FileSharingService } from "../file-sharing.service";

interface TableColumn {
	field: keyof FileSharingResponse;
	header: string;
	width: string;
	sortable: boolean;
	cellType?: "default" | "fileType" | "dateTime" | "size";
}

@Component({
	selector: "fee-table",
	imports: [
		CommonModule,
		TableModule,
		ButtonModule,
		CardModule,
		FormsModule,
		InputTextModule,
		IconFieldModule,
		InputIconModule,
		TagModule,
		TooltipModule,
		SkeletonModule,
		FileSizePipe,
		UploadDatePartPipe,
		TableComponent,
		ColumnComponent,
		TermPipe,
		StatusStateComponent,
	],
	templateUrl: "./table.html",
	styleUrl: "./table.css",
})
export class Table implements OnChanges {
	rows = 10;
	rowsPerPageOptions = [10, 20, 50];
	sortFieldDefault: keyof FileSharingResponse = "fileDtUploadDate";
	sortOrderDefault = -1;
	selectedFiles: FileSharingResponse[] = [];
	TooltipFileNameUserMaxLen: number = 100;
	ListFileSharingDataTemp: FileSharingResponse[] = [];
	@Input() ListFileSharingData: FileSharingResponse[] = [];
	@Input() loading: boolean = true;
	@Input() hasError: boolean = false;
	@Input() AllowedPageSizes: number[] = [];
	@Output() onDeleteFile = new EventEmitter<{
		selectedFiles: FileSharingResponse[];
		deleteShared: boolean;
	}>();
	@Output() onReload = new EventEmitter<void>();
	searchText = "";
	filteredCount = 0;
	filteredList: FileSharingResponse[] = [];
	@ViewChild(TableComponent) tableFileSharing!: TableComponent<FileSharingResponse>;
	readonly skeletonRows = [1, 2, 3, 4, 5];
	readonly skeletonColumns = [1, 2, 3, 4, 5, 6, 7];
	readonly StatusStateEnum = StatusStateEnum;
	private pendingDeleteRequest = false;
	private readonly fileSharingService = inject(FileSharingService);
	private readonly messageService = inject(MessageService);
	private readonly alertService = inject(AlertService);
	readonly GlobalTermService = inject(GlobalTermService);
	private readonly uploadDatePartPipe = new UploadDatePartPipe();
	private readonly fileSizePipe = new FileSizePipe();
	constructor(private readonly termPipe: TermPipe) {}
	ngOnInit() {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes["ListFileSharingData"]) {
			this.ListFileSharingDataTemp = (this.ListFileSharingData ?? []).map(item => ({
				...item,
				uploadedDateText: `${this.uploadDatePartPipe.transform(item.fileDtUploadDate, "date")} ${this.uploadDatePartPipe.transform(item.fileDtUploadDate, "time")}`,
				fileSizeText: this.fileSizePipe.transform(item.fileSize ?? 0),
			}));
			if (this.pendingDeleteRequest) {
				this.clearSelectedFiles();

				this.pendingDeleteRequest = false;
			}
		}
	}

	clearSelectedFiles() {
		this.selectedFiles = [];
		this.tableFileSharing?.ResetTableSelected();
	}

	getFileName(item: FileSharingResponse): string {
		return item.fileNameOriginal || item.fileNameUser || item.fileNameSystem || "-";
	}

	//fin comportamento tabla
	downloadSelectedFiles() {
		if (this.visibleSelectedFiles.length === 0) {
			this.messageService.add({
				severity: "warn",
				icon: "icon icon-warning",
				detail: this.termPipe.transform("SM_AT_LEAST_A_FILE_MUST_BE_SELECTED_TO_DOWNLOAD"),
			});
			return;
		}

		const filesRequest = [...this.visibleSelectedFiles];
		const oneSelected = filesRequest.length === 1;

		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.termPipe.transform("LBL_PREPARING_FILE"),
			detail: this.termPipe.transform("LBL_DOWNLOAD_START_FILE"),
		});

		this.fileSharingService.downloadFile(filesRequest).subscribe({
			next: (event: HttpEvent<Blob>) => {
				const date: string = new Date().toString();
				const formatDate: string = moment(date).format("yyyy-MM-DD_hh-mm");
				const nameFile = oneSelected ? `${filesRequest[0].fileNameUser}.${filesRequest[0].fileExtension!.toLowerCase()}` : `File_Sharing_${formatDate}.zip`;

				if (event.type === HttpEventType.Response) {
					if (event.status === 204 || !event.body) {
						this.messageService.add({
							severity: "error",
							icon: "icon icon-alert",
							summary: this.termPipe.transform("LBL_FILE_FAILED_DOWNLOAD"),
							detail: this.termPipe.transform("LBL_FILE_CONTACT_SUPPORT"),
						});
						return;
					}
					this.handleDownloadResponse(event, nameFile);
				}
			},
			error: () => {
				this.messageService.add({
					severity: "error",
					icon: "icon icon-alert",
					summary: this.termPipe.transform("LBL_FILE_FAILED_DOWNLOAD"),
					detail: this.termPipe.transform("LBL_FILE_CONTACT_SUPPORT"),
				});
			},
		});
	}

	handleDownloadResponse(event: HttpEvent<Blob>, name: string): void {
		this.messageService.add({
			severity: "success",
			icon: "icon icon-success",
			summary: this.termPipe.transform("LBL_FILE_DOWNLOAD_SUCCESS"),
			detail: this.termPipe.transform("LBL_FILE_DOWNLOAD_DEVICE"),
		});
		this.downloadFile(name, event);
		this.clearSelectedFiles();
	}
	downloadFile(fileName: string, blob: any): void {
		const nav = window.navigator as any;
		if (nav.msSaveOrOpenBlob) {
			nav.msSaveOrOpenBlob(blob, fileName);
		} else {
			const link = document.createElement("a");
			link.setAttribute("type", "hidden");
			link.download = fileName;
			link.href = window.URL.createObjectURL(blob.body);
			document.body.appendChild(link);
			link.click();
		}
	}
	async deleteSelectedFiles(): Promise<void> {
		if (!this.visibleSelectedFiles.length) {
			this.alertService.message(this.termPipe.transform("SM_YOU_MUST_SELECT_AT_LEAST_ONE_FILE_TO_DELETE"));
			return;
		}
		const fileDeleteRequest = [...this.visibleSelectedFiles];

		if (fileDeleteRequest.some(file => file.fileCanDelete === 0)) {
			this.alertService.message(this.termPipe.transform("SM_CERTAIN_FILES_WITHIN_THE_CHOSEN_GROUP_CANNOT_BE"));
			return;
		}
		if (fileDeleteRequest.some(file => file.fileShared === 1)) {
			await this.confirmDeleteSharedFiles(fileDeleteRequest);
			return;
		}
		this.pendingDeleteRequest = true;
		this.onDeleteFile.emit({ selectedFiles: fileDeleteRequest, deleteShared: false });
	}
	async confirmDeleteSharedFiles(fileDeleteRequest: FileSharingResponse[]): Promise<void> {
		const result = await this.alertService.confirm(
			this.termPipe.transform("SM_THE_CHOSEN_FILES_HAVE_BEEN_SHARED_WITH_OTHER_US"),
			this.termPipe.transform("SM_WOULD_YOU_LIKE_TO_PROCEED"),
			this.termPipe.transform("SM_YES"),
			this.termPipe.transform("SM_NO"),
			AlertType.WARNING
		);

		if (result.isConfirmed) {
			this.pendingDeleteRequest = true;
			this.onDeleteFile.emit({ selectedFiles: [...fileDeleteRequest], deleteShared: true });
		}
	}

	onEmitSelectedItem(selectedFiles: FileSharingResponse[]) {
		this.selectedFiles = [...selectedFiles];
	}

	onSearchEvent(event: { searchText?: string }) {
		this.searchText = event?.searchText ?? "";
	}

	onListDataFilter(list: FileSharingResponse[]) {
		this.filteredCount = list?.length ?? 0;
		this.filteredList = list ?? [];
	}

	reloadTable() {
		this.onReload.emit();
	}

	get isSystemError(): boolean {
		return this.hasError;
	}

	get isNoData(): boolean {
		return !this.hasError && this.ListFileSharingDataTemp.length === 0;
	}

	get isNoMatches(): boolean {
		return !this.hasError && this.ListFileSharingDataTemp.length > 0 && this.filteredCount === 0 && !!this.searchText.trim();
	}

	get isTableBlocked(): boolean {
		return this.isNoData || this.isSystemError;
	}

	get visibleSelectedFiles(): FileSharingResponse[] {
		if (this.selectedFiles.length === 0) return [];
		if (!this.searchText.trim()) return this.selectedFiles;
		const visibleIds = new Set(this.filteredList.map(f => f.fileId));
		return this.selectedFiles.filter(f => visibleIds.has(f.fileId));
	}

	get hasVisibleSelection(): boolean {
		return this.visibleSelectedFiles.length > 0;
	}

	get isEmptyState(): boolean {
		return this.isNoData || this.isNoMatches || this.isSystemError;
	}

	get downloadTooltip(): string {
		if (this.isTableBlocked) return this.termPipe.transform("SM_NO_DATA_TO_EXPORT");
		if (this.selectedFiles.length === 0) return this.termPipe.transform("SM_AT_LEAST_A_FILE_MUST_BE_SELECTED_TO_DOWNLOAD");
		return "";
	}

	get searchFields(): string[] {
		return [
			this.termPipe.transform("SM_FILE_TYPE"),
			this.termPipe.transform("SM_FILE_NAME"),
			this.termPipe.transform("SM_CATEGORY"),
			this.termPipe.transform("SM_UPLOADED_BY"),
			this.termPipe.transform("SM_UPLOADED_DATE"),
			this.termPipe.transform("SM_SIZE"),
		];
	}
}
