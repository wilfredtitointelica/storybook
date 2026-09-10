import { Component, computed, inject, signal, ViewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ConfigService, GlobalTermService, TermPipe, AlertService } from "intelica-library-base";
import { QueryParametersModel, TruncatePipe, buildSearchLabel, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { TreeTableModule } from "primeng/treetable";
import { MenuItem, MessageService, TreeNode } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { Toast } from "primeng/toast";
import { Tooltip } from "primeng/tooltip";
import { Unsubscribe } from "../unsubscribe/unsubscribe";
import { FeesByDocumentConfiguration } from "../fees-by-document-configuration/fees-by-document-configuration";
import { CardModule } from "primeng/card";
import { CommonModule, DecimalPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DialogModule } from "primeng/dialog";
import { OptOutServicesService } from "../../opt-out-service.service";
import { OptOutServiceFilterService } from "../opt-out-service-filter/service/opt-out-service-filter.service";
import { UpcomingListResponse } from "../../dto/opt-out-service-responses.dto";
import { SortOrderEnum } from "../../../tpe/dto/tpe-responses.dto";
import { BrandEnum } from "../../../library/common/enums";
import { OptOutServiceFilterCommand } from "../../dto/opt-out-service-commands.dto";
import { PaginatorComponent } from "../paginator/paginator.component";
import { PaginatorState } from "primeng/paginator";
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";
import { InputTextModule } from "primeng/inputtext";
import moment from "moment";
import { UnsubcribeService } from "../unsubscribe/service/unsubscribe.service";

@Component({
	selector: "fee-upcoming-opt-outs",
	imports: [
		TermPipe,
		RouterLink,
		Breadcrumb,
		Button,
		FormsModule,
		Toast,
		Skeleton,
		Tooltip,
		CardModule,
		DialogModule,
		Unsubscribe,
		TruncatePipe,
		CommonModule,
		TreeTableModule,
		PaginatorComponent,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		FeesByDocumentConfiguration,
		StatusStateComponent,
	],
	templateUrl: "./upcoming-opt-outs.html",
})
export class UpcomingOptOuts {
	private readonly termPipe = inject(TermPipe);
	public readonly globalTermService = inject(GlobalTermService);
	private readonly configService = inject(ConfigService);
	private readonly optOutService = inject(OptOutServicesService);
	private readonly optOutServiceFilter = inject(OptOutServiceFilterService);
	private readonly alertService = inject(AlertService);
	private readonly unsubcribeService = inject(UnsubcribeService);
	private readonly messageService = inject(MessageService);

	public fullItems: MenuItem[] = [{ label: "OPT_OUT_SERVICES_DASHBOARD", routerLink: "dashboard" }, { label: "UPCOMING_OPT_OUTS" }];

	public readonly filter = this.optOutServiceFilter.filter;
	private readonly sessionInformation = signal(this.configService.SessionInformation);

	private _isloadingSummary = signal<boolean>(false);
	private _isloadingTable = signal<boolean>(true);
	private _isDownloadingExport = signal<boolean>(false);

	public isloadingSummary = computed(() => this._isloadingSummary());
	public isloadingTable = computed(() => this._isloadingTable());
	public isDownloadingExport = computed(() => this._isDownloadingExport());

	public _totalAmount = signal<number>(0);
	private readonly _queryParams = signal<QueryParametersModel>({
		FilterBy: "",
		FilterValue: "",
		FilterOperator: "",
		OrderBy: "billingStarts" as keyof UpcomingListResponse,
		SortDirection: "asc" as "desc" | "asc",
		PageNumber: 1,
		PageSize: 10,
	});

	private refresh = this.unsubcribeService.refresh;

	public dataResponse = this.optOutService.buildTableSignal(cmd => this.optOutService.getUpcomingTable(cmd), this._isloadingTable, this.filter, this._queryParams, undefined, this.refresh);

	public isGroup = computed(() => this.sessionInformation()?.isGroup ?? false);
	public dataTable = computed<TreeNode[]>(() => {
		const data = this.dataResponse()?.summary.items ?? [];
		return this.mapToTreeNodes(data);
	});
	private mapToTreeNodes(data: UpcomingListResponse[]): TreeNode[] {
		return data.map(item => ({
			data: item,
			children: item.children?.length ? this.mapToTreeNodes(item.children) : [],
		}));
	}
	public currencyCode = computed<string>(() => this.optOutServiceFilter.currencyCode());
	public sortField = computed<keyof UpcomingListResponse>(() => this._queryParams().OrderBy as keyof UpcomingListResponse);
	public sortDirection = computed<SortOrderEnum>(() => (this._queryParams().SortDirection === "asc" ? SortOrderEnum.Ascending : SortOrderEnum.Descending));
	public rowsPerPage = computed<number>(() => this.dataResponse()?.pageSize ?? 10);
	public currentPage = computed<number>(() => this.dataResponse()?.pageNumber ?? 1);
	public searchText = computed<string>(() => this._queryParams().FilterValue ?? "");
	public statusStateEnum = StatusStateEnum;
	public totalItems = computed<number>(() => this.dataResponse()?.totalCount ?? 0);
	public searchFields = computed(() => {
		const term = (key: string) => this.termPipe.transform(key, this.globalTermService.languageCode);
		return [term("ANNOUNCEMENT"), ...(this.isGroup() ? [term("INSTITUTION")] : []), term("BUSINESS"), term("SERVICE")];
	});

	public readonly maxLength = 56;
	public readonly brandEnum = BrandEnum;

	public first = computed<number>(() => (this.currentPage() - 1) * this.rowsPerPage());
	public totalPages = computed<number>(() => {
		const totalItems = this.dataResponse()?.totalCount ?? 0;
		const rowsPerPage = this._queryParams()?.PageSize ?? 10;
		return rowsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / rowsPerPage)) : 1;
	});

	searchInput: string = "";
	options = [
		{ label: 10, value: 10 },
		{ label: 25, value: 25 },
		{ label: 50, value: 50 },
		{ label: 100, value: 100 },
	];
	private readonly maxPlaceholderLength = 20;

	@ViewChild(Unsubscribe) unsubscribeComponent!: Unsubscribe;
	@ViewChild(FeesByDocumentConfiguration) feesDialog!: FeesByDocumentConfiguration;
	constructor() {}
	ngOnInit() {
		this.searchInput = this.searchText() ?? "";
	}

	openUnsubscribeDialog(bankId: number, opcId: number): void {
		this.unsubscribeComponent.openDialog(bankId, opcId, false);
	}

	openFeesDialog(opcId: number, opcName: string, clientId: number): void {
		this.feesDialog.openDialog(opcId, opcName, clientId);
	}

	public onSearchParamsChange(params: QueryParametersModel): void {
		this._queryParams.update(prev => ({
			...prev,
			...params,
			SortDirection: params.SortDirection ?? prev.SortDirection,
			PageNumber: params.PageNumber ?? prev.PageNumber,
			PageSize: params.PageSize ?? prev.PageSize,
			FilterValue: params.FilterValue ?? prev.FilterValue,
		}));
	}

	public exportExcel(): void {
		const command = this.buildDownloadCommand();

		this._isDownloadingExport.set(true);
		this.showDownloadToast(1);
		this.optOutService.downloadUpcoming(command).subscribe({
			next: response => {
				const blob = response.body;
				if (!blob) return;

				const filename = `${moment().format("YYYYMMDD_HHmm")}_${this.termPipe.transform("UPCOMING_OPT_OUTS_EXPORT", this.globalTermService.languageCode)}_${this.termPipe.transform(
					"LIST_CONTENT_TYPE",
					this.globalTermService.languageCode
				)}.xlsx`;

				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = filename;
				a.click();

				window.URL.revokeObjectURL(url);
				this.showDownloadToast(2);
			},
			error: () => {
				this.showDownloadToast(3);
				this._isDownloadingExport.set(false);
			},
			complete: () => this._isDownloadingExport.set(false),
		});
	}

	private buildDownloadCommand(): OptOutServiceFilterCommand {
		const base = this.optOutService["mapToCommand"](this.filter());
		base.applyQueryParameters(this._queryParams());
		return base;
	}

	onPageChange(event: PaginatorState) {
		const first = event.first ?? 0;
		const rows = event.rows ?? 10;
		const valueNumber = Math.floor(first / rows) + 1;
		this._queryParams.set({
			...this._queryParams(),
			PageSize: rows,
			PageNumber: valueNumber,
		});
	}

	onRowsPerPageChanged(size: number): void {
		const rows = Number(size) || 10;
		const first = 0;
		const valueNumber = 1;
		this._queryParams.set({
			...this._queryParams(),
			PageSize: rows,
			PageNumber: valueNumber,
		});
	}

	clearSearch(): void {
		this.searchInput = "";
		const searchText = this.searchInput ?? "";
		const valueNumber = 1;
		this._queryParams.set({
			...this._queryParams(),
			FilterValue: searchText,
			PageNumber: valueNumber,
			PageSize: this.rowsPerPage(),
		});
	}

	onSearchEnter(event: Event): void {
		event.preventDefault();
		const searchText = this.searchInput ?? "";
		const valueNumber = 1;
		this._queryParams.set({
			...this._queryParams(),
			FilterValue: searchText,
			PageNumber: valueNumber,
			PageSize: this.rowsPerPage(),
		});
	}

	onSearchClick(event: Event): void {
		event.preventDefault();
		const searchText = this.searchInput ?? "";
		const valueNumber = 1;
		this._queryParams.set({
			...this._queryParams(),
			FilterValue: searchText,
			PageNumber: valueNumber,
			PageSize: this.rowsPerPage(),
		});
	}

	onSort(event: any): void {
		const field = String(event?.field ?? "");
		const valueNumber = 1;
		if (!field) {
			return;
		}
		const order = Number(event?.order) === -1 ? "desc" : "asc";
		if (this._queryParams().OrderBy != field || this._queryParams().SortDirection != order) {
			this._queryParams.set({
				...this._queryParams(),
				PageNumber: valueNumber,
				PageSize: this.rowsPerPage(),
				OrderBy: field,
				SortDirection: order,
			});
		}
	}

	public onClickAnnouncement(documentId: number) {
		if (documentId == null || documentId == 0) return;
		this.optOutService.downloadDocument(documentId).subscribe({
			next: response => {
				if (!response.body) return;
				const contentType = response.body?.type || "";

				const fileName = this.optOutService.getFileNameFromHeader(response) ?? `document_${moment().format("YYYYMMDD")}`;

				if (contentType.toLowerCase().includes("pdf")) {
					this.optOutService.viewFile(fileName, { body: response.body });
				} else {
					this.optOutService.downloadFile(fileName, response);
				}
			},
			error: () => {
				this.alertService.message(this.termPipe.transform("FileNotFound", this.globalTermService.languageCode));
			},
			complete: () => {},
		});
	}
	get isNoMatchesState(): boolean {
		return !this.isloadingTable() && this.dataTable().length === 0 && this.searchText().length > 0;
	}

	get isNoDataState(): boolean {
		return !this.isloadingTable() && this.dataTable().length === 0 && this.searchText().length === 0;
	}

	public getTootlTipDescription(rowData: UpcomingListResponse): string {
		var text =
			rowData.announcementCode +
			"\n" +
			rowData.announcementTitle +
			"\n" +
			this.termPipe.transform("PUBLICATION_DATE", this.globalTermService.languageCode) +
			": " +
			moment(rowData.publicationDate).format("DD MMM, yyyy") +
			"\n" +
			this.termPipe.transform("TRIAL_PERIOD_STARTS", this.globalTermService.languageCode) +
			": " +
			moment(rowData.trialPeriodStarts).format("DD MMM, yyyy");
		return text;
	}

	private showDownloadToast(message: number): void {
		if (message === 1) {
			this.messageService.add({
				severity: "secondary",
				icon: "icon icon-loading",
				summary: this.termPipe.transform("PREPARING_YOUR_FILE", this.globalTermService.languageCode),
				detail: this.termPipe.transform("YOUR_DOWNLOAD_WILL_START", this.globalTermService.languageCode),
			});
		} else if (message === 2) {
			this.messageService.add({
				severity: "success",
				icon: "icon icon-success",
				summary: this.termPipe.transform("FILE_DOWNLOADED_SUCCESSFULLY", this.globalTermService.languageCode),
				detail: this.termPipe.transform("YOUR_FILE_HAS_BEEN", this.globalTermService.languageCode),
			});
		} else {
			this.messageService.add({
				severity: "error",
				icon: "icon icon-alert",
				summary: this.termPipe.transform("DOWNLOAD_FAILED", this.globalTermService.languageCode),
				detail: this.termPipe.transform("WE_COULDNT_GENERATE_FILE", this.globalTermService.languageCode),
			});
		}
	}

	private get searchLabel() {
		return buildSearchLabel(this.termPipe, this.globalTermService.languageCode, this.searchFields(), this.maxPlaceholderLength);
	}

	get searchPlaceholder(): string {
		return this.searchLabel.placeholder;
	}

	get searchTooltip(): string {
		return this.searchLabel.tooltip;
	}
}
