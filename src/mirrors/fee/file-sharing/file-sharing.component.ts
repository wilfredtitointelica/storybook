import { Component, inject, OnInit, WritableSignal } from "@angular/core";
import { Upload } from "./upload/upload";
import { Table } from "./table/table";
import { Header } from "./header/header";
import { CommonModule } from "@angular/common";
import { finalize, forkJoin, fromEvent, Subscription } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { AlertButtonMode, AlertService, AlertType, ConfigService, GlobalTermService, IntelicaAlertComponent, SkeletonService, SpinnerService, TermPipe } from "intelica-library-base";
import { CommonService } from "./domain/common.service";
import { FileSharingFilterRequest } from "./DTO/request";
import { FileCategoryResponse, FileSharingResponse, PeriodFilterResponse } from "./DTO/response";
import moment from "moment";
import _ from "lodash";
import { FileSharingService } from "./file-sharing.service";
import { ClientBankResponse, ClientInformationResponse } from "../common/DTO/client-response";
@Component({
	selector: "fee-file-sharing",
	imports: [Upload, Table, Header, CommonModule, IntelicaAlertComponent, ToastModule],
	templateUrl: "./file-sharing.html",
	styleUrl: "./file-sharing.css",
})
export class FileSharingComponent implements OnInit {
	private readonly skeletonService = inject(SkeletonService);
	isloading: WritableSignal<boolean> = this.skeletonService.isLoading;
	showUpload = false;
	fileSharingFilteRequest: FileSharingFilterRequest = {} as FileSharingFilterRequest;
	ListFileSharingData: FileSharingResponse[] = [];
	hasError: boolean = false;
	ListCategory: FileCategoryResponse[] = [];
	ExtensionsAllowed: string = ".docx|.xlsx|.xls|.pptx|.zip|.rar|.txt|.pdf|.7zip|.csv|.jpg|.jpeg";
	MaxFileSize: string = "300mb";
	ListPeriod: PeriodFilterResponse[] = [];
	LenguajeCode = "EN";
	applyFilter: boolean = false;
	status: string[] = [];
	AllowedPageSizes: number[] = [];
	PropertiesPage: any[] = [];
	fileAlertId: number = 0;
	clientInformationResponse: ClientInformationResponse = {} as ClientInformationResponse;
	clientOptions: ClientBankResponse[] = [];
	showOptionGroup: boolean = false;
	minDate?: Date;
	maxDate?: Date;
	private changeLanguageSubscription!: Subscription;
	readonly GlobalTermService = inject(GlobalTermService);
	private readonly fileSharingService = inject(FileSharingService);
	private readonly commonFileSharingService = inject(CommonService);
	private readonly spinnerService = inject(SpinnerService);
	private readonly messageService = inject(MessageService);
	private readonly alertService = inject(AlertService);
	private readonly route = inject(ActivatedRoute);
	private readonly config = inject(ConfigService);

	constructor(private readonly termPipe: TermPipe) {}
	ngOnInit(): void {
		this.validRoute();
		this.showOptionGroup = (this.config.SessionInformation?.isGroup ?? false) || (this.config.SessionInformation?.isAdmin ?? false);

		this.LenguajeCode = this.GlobalTermService.languageCode;
		this.termPipe.transform("QuestionSaveChanges");
		this.validLenguageChange();
		this.getInitPage();
	}
	ngOnDestroy(): void {
		if (this.changeLanguageSubscription) {
			this.changeLanguageSubscription.unsubscribe();
		}
	}
	private validRoute() {
		this.route.queryParams.subscribe((response: any) => {
			const fileAlertId: number = response["FileAlertId"];
			if (fileAlertId) {
				if (this.commonFileSharingService.isNumber(fileAlertId)) this.fileAlertId = fileAlertId;
			}
		});
	}
	private validLenguageChange() {
		this.changeLanguageSubscription = fromEvent<CustomEvent>(window, "ChangeLanguage").subscribe(event => {
			const newLang = event.detail.LanguageCode;

			if (newLang !== this.LenguajeCode) {
				this.LenguajeCode = newLang;
				this.getInitPage();
			}
		});
	}
	private getInitPage() {
		this.GetPropertiesPage();
		this.status = [...this.commonFileSharingService.getListStatus(this.LenguajeCode)];
		this.skeletonService.show();
		forkJoin({
			periods: this.fileSharingService.getListPeriod(),
			categories: this.fileSharingService.getListCategory(),
			clientInformationResponse: this.fileSharingService.GetClientInformation(),
			dateRange: this.fileSharingService.GetDateRange(),
		}).subscribe({
			next: ({ periods, categories, clientInformationResponse, dateRange }) => {
				this.minDate = dateRange?.minDate ? new Date(dateRange.minDate) : undefined;
				this.maxDate = dateRange?.maxDate ? new Date(dateRange.maxDate) : undefined;
				this.clientInformationResponse = clientInformationResponse;
				this.clientOptions = [...(this.clientInformationResponse?.banks ?? [])];
				periods.forEach(p => {
					p.descriptionTerm = this.termPipe.transform(p.description);
				});
				this.ListPeriod = [...periods];
				this.ListCategory = [...categories];
				this.fileSharingFilteRequest = {
					...this.commonFileSharingService.initSetFilterRequest(this.ListPeriod, this.clientOptions),
				};
				this.clampRequestDatesToBoundaries();
				if (this.fileAlertId <= 0) this.FileSharingFilter(false);
				else {
					this.fileSharingService
						.ListFileAlertById(this.fileAlertId)
						.pipe(finalize(() => this.skeletonService.hide()))
						.subscribe(response => {
							this.ListFileSharingData = [...response];
						});
				}
			},
			error: err => {
				console.error("Error al cargar datos:", err);
				this.skeletonService.hide();
			},
		});
	}
	private clampRequestDatesToBoundaries(): void {
		if (this.minDate && this.fileSharingFilteRequest.startDate && this.fileSharingFilteRequest.startDate < this.minDate) {
			this.fileSharingFilteRequest.startDate = this.minDate;
		}
		if (this.maxDate && this.fileSharingFilteRequest.endDate && this.fileSharingFilteRequest.endDate > this.maxDate) {
			this.fileSharingFilteRequest.endDate = this.maxDate;
		}
	}
	FileSharingFilter(showSkeleton: boolean = true) {
		if (showSkeleton) {
			this.skeletonService.show();
		}
		this.applyFilter = !this.applyFilter;
		this.fileSharingFilteRequest.startDate = moment(this.fileSharingFilteRequest.startDate).startOf("day").toDate();
		this.fileSharingFilteRequest.endDate = moment(this.fileSharingFilteRequest.endDate).endOf("day").toDate();

		this.fileSharingService
			.listFileSharing(this.fileSharingFilteRequest)
			.pipe(finalize(() => this.skeletonService.hide()))
			.subscribe({
				next: res => {
					this.ListFileSharingData = [...res];
					this.hasError = false;
				},
				error: () => {
					this.ListFileSharingData = [];
					this.hasError = true;
				},
			});
	}

	onProcessFile(event: any) {
		this.FileSharingFilter();
	}
	async confirmDeleteFile(event: any) {
		let deleteShared: number = event.deleteShared ? 1 : 0;

		if (event.deleteShared) {
			this.deleteFile(event.selectedFiles, deleteShared);
		} else {
			const titleMessage: string = this.termPipe.transform("LBL_DELETE_FILE");

			const subtitleMessage: string = this.termPipe.transform("LBL_SUB_TITLE_DELETE_FILE");
			const result = await this.alertService.show({
				type: AlertType.ERROR,
				title: titleMessage,
				subtitle: subtitleMessage,
				buttonMode: AlertButtonMode.CONFIRM_CANCEL,
				buttons: {
					confirmText: this.termPipe.transform("BTN_ACCEPT"),
					cancelText: this.termPipe.transform("BTN_CANCEL"),
				},
				styles: {
					iconBackgroundColor: "#e8f5e9",
					confirmButtonTextColor: "#ffffff",
					cancelButtonColor: "#f5f5f5",
					cancelButtonTextColor: "#616161",
					width: "450px",
				},
				customIcon: "icon-alert",
			});

			if (!result.isConfirmed) {
				return;
			}
			this.deleteFile(event.selectedFiles, deleteShared);
		}
	}
	deleteFile(files: FileSharingResponse[], deleteShared: number) {
		this.spinnerService.show();
		this.fileSharingService.deleteFiles(files, deleteShared).subscribe(isDeleted => {
			if (!isDeleted) {
				this.messageService.add({
					severity: "success",
					icon: "icon icon-success",
					detail: this.termPipe.transform("SM_ONLY_THE_OWNER_HAS_THE_PERMISSION_TO_DELETE_THE_FILE"),
					life: 4000,
				});
			}
			this.FileSharingFilter();
			this.spinnerService.hide();
			this.messageService.add({
				severity: "success",
				icon: "icon icon-success",
				detail: this.termPipe.transform("SM_THE_FILE_HAVE_BEEN_SUCCESSFULLY_DELETED"),
				life: 4000,
			});
		});
	}
	onApplyFilter(applyFilterRequest: FileSharingFilterRequest) {
		this.fileSharingFilteRequest = { ...applyFilterRequest };
		this.FileSharingFilter();
	}

	GetPropertiesPage() {
		this.fileSharingService.GetPropertiesPage().subscribe(response => {
			this.PropertiesPage = response;
			if (response?.length > 0) {
				this.ExtensionsAllowed = response.find(d => d.propertyCode === "EA")?.propertyValue || this.ExtensionsAllowed;
				this.MaxFileSize = response.find(d => d.propertyCode === "MS")?.propertyValue || this.MaxFileSize;
				this.AllowedPageSizes = _.map(_.split(response.find(d => d.propertyCode === "RP")?.propertyValue!, ","), (x: any) => _.toNumber(_.trim(x)));
			}
		});
	}
	// javier para abajo
	toggleUploadPanel() {
		this.showUpload = !this.showUpload;
	}
}
