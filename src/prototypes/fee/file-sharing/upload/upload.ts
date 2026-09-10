import { CommonModule } from "@angular/common";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { Component, EventEmitter, inject, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AlertService, GlobalTermService, TermPipe } from "intelica-library-base";
import { TableComponent, ColumnComponent } from "intelica-library-project";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { FileUploadModule } from "primeng/fileupload";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ProgressBarModule } from "primeng/progressbar";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";
import { FileSizePipe } from "../../common/pipe/file-size.pipe";
import { FileStatusEnum } from "../common/enums";
import { InputFileRequest, FileTableRequest } from "../DTO/request";
import { FileCategoryResponse } from "../DTO/response";
import { CommonService } from "../domain/common.service";
import { FileSharingService } from "../file-sharing.service";
import { ProgressSpinnerModule } from "primeng/progressspinner";

interface UploadTableColumn {
	field: "extension" | "name" | "description" | "category" | "size" | "status" | "remove";
	header: string;
	width: string;
	cellType: "fileType" | "name" | "description" | "category" | "size" | "status" | "remove";
}

@Component({
	selector: "fee-upload",
	imports: [
		CommonModule,
		FormsModule,
		FileUploadModule,
		ButtonModule,
		ProgressBarModule,
		DialogModule,
		MessageModule,
		TableModule,
		SkeletonModule,
		InputTextModule,
		SelectModule,
		TextareaModule,
		ToastModule,
		TooltipModule,
		FileSizePipe,
		TableComponent,
		ColumnComponent,
		TermPipe,
		ProgressSpinnerModule,
	],
	templateUrl: "./upload.html",
	styleUrls: ["./upload.css"],
	standalone: true,
})
export class Upload {
	readonly GlobalTermService = inject(GlobalTermService);
	private readonly fileSharingService = inject(FileSharingService);
	private readonly commonFileSharingService = inject(CommonService);
	private readonly alertService = inject(AlertService);
	private readonly messageService = inject(MessageService);
	constructor(private readonly termPipe: TermPipe) {}

	@Input() extensionsAllowed: string = "";
	@Input() maxFileSize: string = "";
	@Input() ListCategory: FileCategoryResponse[] = [];
	@Output() onProcessFile = new EventEmitter<any>();

	files: InputFileRequest[] = [];
	rows = 5;
	rowsPerPageOptions = [5, 10, 20];
	modalVisible = false;
	loading = false;
	uploadStarted = false;
	status: string[] = [];
	readonly skeletonRows = [1, 2, 3, 4, 5];
	readonly skeletonColumns = [1, 2, 3, 4, 5, 6, 7];

	ngOnInit() {
		this.status = [...this.commonFileSharingService.getListStatus(this.GlobalTermService.languageCode)];
	}

	onFilesAdded(event: any) {
		if (this.uploadStarted) return;

		const newFiles: File[] = Array.isArray(event?.files) ? event.files : Array.from(event?.files ?? event?.originalEvent?.target?.files ?? []);
		if (!newFiles.length) return;

		newFiles.forEach(file => this.addFile(file, file.name));

		this.files = [...this.files];
		if (this.files.length > 0) {
			this.modalVisible = true;
		}
	}

	private addFile(file: File, fullName: string): void {
		const dotIndex = file.name.lastIndexOf(".");
		const extension = file.name
			.substring(dotIndex >= 0 ? dotIndex : file.name.length)
			.toLowerCase()
			.trim();
		const exists = this.commonFileSharingService.isExtensionAllowed(file, this.extensionsAllowed);
		const validMaxSize = this.commonFileSharingService.evalMaxSize(file.size, this.maxFileSize);

		const isCorrect = exists && validMaxSize;
		const status = isCorrect ? FileStatusEnum.READY : FileStatusEnum.NOT_VALID;
		const errorTooltip = isCorrect ? "" : this.getInvalidStatusTooltip(exists, validMaxSize);

		this.files.push({
			fileId: 0,
			file,
			fileName: fullName,
			fileNameSystem: "",
			fileExtension: extension.replace(".", "").toUpperCase(),
			extension: extension.replace(".", "").toUpperCase(),
			name: fullName.replace(extension, "").trim(),
			description: "",
			category: 0,
			isCorrect,
			message: "",
			load: -1,
			size: file.size,
			status,
			subscription: undefined,
			base64: "",
			filePath: "",
			errorTooltip,
		});
	}

	validFile(file: InputFileRequest): void {
		this.cleanFileName(file);
		const hasName = file.name.trim() !== "";
		const isExtensionValid = this.commonFileSharingService.isExtensionAllowed(file.file, this.extensionsAllowed);
		const isSizeValid = this.commonFileSharingService.evalMaxSize(file.size, this.maxFileSize);

		file.isCorrect = hasName && isExtensionValid && isSizeValid;
		if (!hasName) {
			file.status = FileStatusEnum.NOT_READY;
			file.errorTooltip = "";
			return;
		}

		if (file.isCorrect) {
			file.status = FileStatusEnum.READY;
			file.errorTooltip = "";
			return;
		}

		file.status = FileStatusEnum.NOT_VALID;
		file.errorTooltip = this.getInvalidStatusTooltip(isExtensionValid, isSizeValid);
	}

	cleanFileName(file: InputFileRequest): void {
		file.name = this.commonFileSharingService.sanitizeFileName(file.name);
	}

	ValidInputFileName(event: any, file: InputFileRequest) {
		this.cleanFileName(file);
		event.target.value = file.name;
	}

	isPreparingProcess(): boolean {
		if (this.files.length === 0) return false;
		return this.files.every(
			file =>
				file.status === FileStatusEnum.READY ||
				file.status === FileStatusEnum.UPLOADING ||
				file.status === FileStatusEnum.NOT_READY ||
				file.status === FileStatusEnum.ERROR_EXTENSION ||
				file.status === FileStatusEnum.ERROR_SIZE ||
				file.status === FileStatusEnum.NOT_VALID
		);
	}

	CancelUpload(file: InputFileRequest) {
		if (
			file.status === FileStatusEnum.READY ||
			file.status === FileStatusEnum.NOT_READY ||
			file.status === FileStatusEnum.ERROR_EXTENSION ||
			file.status === FileStatusEnum.ERROR_SIZE ||
			file.status === FileStatusEnum.NOT_VALID
		) {
			this.files = [...this.files.filter(f => f !== file)];
			if (this.files.length === 0) {
				this.closeModal();
			}
			return;
		}

		if (file.status === FileStatusEnum.UPLOADING) {
			file.subscription?.unsubscribe();
			file.status = FileStatusEnum.CANCELED;
		}
	}

	removeFileFromTable(file: InputFileRequest) {
		if (file.status === FileStatusEnum.UPLOADING) {
			file.subscription?.unsubscribe();
		}
		this.files = this.files.filter(f => f !== file);
		this.messageService.add({
			severity: "success",
			icon: "icon icon-success",
			detail: this.termPipe.transform("SM_THE_FILE_HAVE_BEEN_SUCCESSFULLY_DELETED"),
			life: 4000,
		});
		if (this.files.length === 0) {
			this.closeModal();
		}
	}

	closeModal() {
		this.CancelProcess();
	}

	CancelProcess() {
		this.files = [];
		this.modalVisible = false;
		this.uploadStarted = false;
	}

	IsFileUploaded(file: InputFileRequest): boolean {
		return file.status === FileStatusEnum.UPLOADED || file.status === FileStatusEnum.CANCELED;
	}

	IsUploadedFiles(): boolean {
		if (this.files.length === 0) return false;
		return this.files.every(file => file.status === FileStatusEnum.UPLOADED || file.status === FileStatusEnum.CANCELED);
	}

	FilesReady(): boolean {
		if (this.files.length === 0) return true;
		return this.files.every(file => file.status === FileStatusEnum.READY);
	}

	async processFiles() {
		this.uploadStarted = true;

		for (const file of this.files) {
			if (!file.isCorrect) continue;

			const base64 = await this.commonFileSharingService.convertFileToBase64(file.file);
			const model: InputFileRequest = {
				...file,
				load: 0,
				status: FileStatusEnum.READY,
				base64,
			};

			file.status = FileStatusEnum.UPLOADING;
			file.load = 0;

			file.subscription = this.fileSharingService.uploadFile(model).subscribe({
				next: (event: HttpEvent<any>) => {
					if (event.type === HttpEventType.UploadProgress) {
						file.load = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
					}

					if (event.type === HttpEventType.Response) {
						file.status = FileStatusEnum.UPLOADED;
						file.fileId = event.body.fileId;
						file.fileNameSystem = event.body.fileNameSystem;
						file.load = 100;
					}
				},
				error: () => {
					file.fileId = -1;
					this.CancelProcess();
					this.alertService.message(this.termPipe.transform("SM_ERROR"));
				},
			});
		}
	}

	completeProcess() {
		const uploadedFiles: FileTableRequest[] = this.files
			.filter(file => file.status === FileStatusEnum.UPLOADED)
			.map(file => {
				file.subscription?.unsubscribe();
				return { fileId: file.fileId, fileShared: 0 };
			});

		if (uploadedFiles.length > 0) {
			this.fileSharingService.SendUploadNotification(uploadedFiles).subscribe(() => {});
			this.messageService.add({
				severity: "success",
				icon: "icon icon-success",
				detail: this.termPipe.transform("TXT_FILES_HAS_BEEN_UPLOADED"),
				life: 4000,
			});
		}

		this.CancelProcess();
		this.onProcessFile.emit([]);
	}

	getTermStatus(statusCode: number): string {
		return this.status[statusCode] ?? "";
	}

	getStatusTooltip(file: InputFileRequest): string {
		if (file.status === FileStatusEnum.UPLOADED) {
			return this.getProcessedStatusTooltip();
		}
		if (file.status === FileStatusEnum.READY) {
			return this.commonFileSharingService.getUploadReadyTooltip(this.GlobalTermService.languageCode);
		}
		return file.errorTooltip || this.getInvalidStatusTooltip();
	}

	isStatusOk(file: InputFileRequest): boolean {
		return file.status === FileStatusEnum.READY || file.status === FileStatusEnum.UPLOADED;
	}

	private getProcessedStatusTooltip(): string {
		return this.commonFileSharingService.getUploadProcessedTooltip(this.GlobalTermService.languageCode);
	}

	private getInvalidStatusTooltip(isExtensionValid?: boolean, isSizeValid?: boolean): string {
		return this.commonFileSharingService.getInvalidUploadStatusTooltip(this.GlobalTermService.languageCode, this.maxFileSize, isExtensionValid, isSizeValid);
	}
}
