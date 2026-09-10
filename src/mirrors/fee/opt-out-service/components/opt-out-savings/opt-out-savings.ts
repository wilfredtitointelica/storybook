import { Component, ViewChild, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ConfigService, GlobalTermService, AlertService, TermPipe } from "intelica-library-base";
import { ColumnComponent, QueryParametersModel, RowResumenComponent, TableFetchComponent, TruncatePipe, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { MenuItem, MessageService } from "primeng/api";
import { Breadcrumb } from "primeng/breadcrumb";
import { Button } from "primeng/button";
import { CardModule } from "primeng/card";
import { Skeleton } from "primeng/skeleton";
import { Toast } from "primeng/toast";
import { Tooltip } from "primeng/tooltip";
import { OptOutServicesService } from "../../opt-out-service.service";
import { OptOutServiceFilterService } from "../opt-out-service-filter/service/opt-out-service-filter.service";
import { BrandEnum } from "../../../library/common/enums";
import { OptOutSavingsListResponse } from "../../dto/opt-out-service-responses.dto";
import { SortOrderEnum } from "../../../common/enums/common.enum";
import { OptOutServiceFilterCommand } from "../../dto/opt-out-service-commands.dto";
import { CommonModule, DecimalPipe } from "@angular/common";
import moment from "moment";
import { FormatValuePipe } from "../../../common/pipe/format-value.pipe";
import { PeriodFilterTypeEnum } from "../../common/enums/opt-out-service.enum";
import { FormatDateConstants } from "../../../common/constants/format.date";
import { CommonGlobalService } from "../../../common/services/common.service";
import { OPT_OUT_SAVINGS_BREADCRUMB } from "../../../library/common/constants";

const OPT_OUT_SAVINGS_TABLE_KEY = "opt-out-savings";

@Component({
	selector: "fee-opt-out-savings",
	imports: [
		TermPipe,
		RouterLink,
		Breadcrumb,
		Button,
		Toast,
		Skeleton,
		Tooltip,
		CardModule,
		TableFetchComponent,
		RowResumenComponent,
		ColumnComponent,
		TruncatePipe,
		DecimalPipe,
		CommonModule,
		FormatValuePipe,
		StatusStateComponent,
	],
	templateUrl: "./opt-out-savings.html",
})
export class OptOutSavings {
	private readonly termPipe = inject(TermPipe);
	public readonly globalTermService = inject(GlobalTermService);
	private readonly configService = inject(ConfigService);
	private readonly optOutService = inject(OptOutServicesService);
	private readonly optOutServiceFilter = inject(OptOutServiceFilterService);
	private readonly alertService = inject(AlertService);
	private readonly messageService = inject(MessageService);
	private readonly commonGlobalService = inject(CommonGlobalService);
	private readonly route = inject(ActivatedRoute);

	public fullItems: MenuItem[] = [{ label: "OPT_OUT_SERVICES_DASHBOARD", routerLink: "/fee/opt-out-service/dashboard" }, { label: "OPT_OUT_SAVINGS" }];

	public readonly filter = this.optOutServiceFilter.filter;
	public readonly periodTypeMap = this.optOutServiceFilter.periodTypeMap;
	private readonly sessionInformation = signal(this.configService.SessionInformation);

	private _isloadingSummary = signal<boolean>(true);
	private _isloadingTable = signal<boolean>(true);
	private _isDownloadingExport = signal<boolean>(false);

	public isloadingSummary = computed(() => this._isloadingSummary());
	public isloadingTable = computed(() => this._isloadingTable());
	public isDownloadingExport = computed(() => this._isDownloadingExport());

	public _totalAmount = signal<number>(0);
	private readonly restoredTableState = this.route.snapshot.paramMap.has("returnFrom") ? this.optOutServiceFilter.getTableState(OPT_OUT_SAVINGS_TABLE_KEY) : null;
	private readonly _queryParams = signal<QueryParametersModel>({
		FilterBy: "",
		FilterValue: this.restoredTableState?.searchText ?? "",
		FilterOperator: "",
		OrderBy: "amount" as keyof OptOutSavingsListResponse,
		SortDirection: "desc" as "desc" | "asc",
		PageNumber: this.restoredTableState?.currentPage ?? 1,
		PageSize: 10,
	});

	public dataSummary = this.optOutService.buildTableSignal(cmd => this.optOutService.getSavingsSummary(cmd), this._isloadingSummary, this.filter, this._queryParams);
	public dataResponse = this.optOutService.buildTableSignal(cmd => this.optOutService.getSavingsTable(cmd), this._isloadingTable, this.filter, this._queryParams);

	public isGroup = computed(() => this.sessionInformation()?.isGroup ?? false);
	public dataTable = computed(() => this.dataResponse()?.summary.items ?? []);
	public currencyCode = computed<string>(() => this.optOutServiceFilter.currencyCode());
	public sortField = computed<keyof OptOutSavingsListResponse>(() => this._queryParams().OrderBy as keyof OptOutSavingsListResponse);
	public sortDirection = computed<SortOrderEnum>(() => (this._queryParams().SortDirection === "asc" ? SortOrderEnum.Ascending : SortOrderEnum.Descending));
	public rowsPerPage = computed<number>(() => this._queryParams().PageSize ?? 10);
	public currentPage = computed<number>(() => this._queryParams().PageNumber ?? 1);
	public searchText = computed<string>(() => this._queryParams().FilterValue ?? "");
	public statusStateEnum = StatusStateEnum;
	public totalItems = computed<number>(() => this.dataResponse()?.totalCount ?? 0);
	public totalBilled = computed<number>(() => this.dataResponse()?.summary.totalBilled ?? 0);
	public totalMonthlySavings = computed<number>(() => this.dataResponse()?.summary.monthlySavings ?? 0);
	public totalAnnualSavings = computed<number>(() => this.dataResponse()?.summary.annualSavings ?? 0);
	public searchFields = computed(() => {
		const term = (key: string) => this.termPipe.transform(key, this.globalTermService.languageCode);
		return [...(this.isGroup() ? [term("INSTITUTION")] : []), term("SERVICE"), term("BUSINESS"), term("FEE_CODE"), term("FEE_NAME")];
	});

	public readonly maxLength = 40;
	public readonly brandEnum = BrandEnum;

	@ViewChild(TableFetchComponent) tableFetch!: TableFetchComponent<OptOutSavingsListResponse>;

	ngOnInit() {}

	public onSearchParamsChange(params: QueryParametersModel): void {
		this._queryParams.update(prev => ({
			...prev,
			...params,
			SortDirection: params.SortDirection ?? prev.SortDirection,
			PageNumber: params.PageNumber ?? prev.PageNumber,
			PageSize: params.PageSize ?? prev.PageSize,
			FilterValue: params.FilterValue ?? prev.FilterValue,
		}));
		this.optOutServiceFilter.clearTableState(OPT_OUT_SAVINGS_TABLE_KEY);
	}

	public exportExcel(): void {
		const command = this.buildDownloadCommand();

		this._isDownloadingExport.set(true);
		this.showDownloadToast(1);
		this.optOutService.downloadSavings(command).subscribe({
			next: response => {
				const blob = response.body;
				if (!blob) return;

				const filename = `${moment().format("YYYYMMDD_HHmm")}_${this.termPipe.transform("OPT_OUT_SAVINGS_EXPORT", this.globalTermService.languageCode)}_${this.termPipe.transform(
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

	public onClickAnnouncement(documentId: number) {
		if (documentId == null || documentId == 0) return;
		this.optOutService.downloadDocument(documentId).subscribe({
			next: response => {
				if (!response.body) return;
				const contentType = response.body?.type || "";
				const disposition = response.headers.get("content-disposition") || "";

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

	public goToDetail(rowData: OptOutSavingsListResponse): void {
		if (rowData.feeId === 0) {
			return;
		}

		this.optOutServiceFilter.captureFilterForDetail();
		this.optOutServiceFilter.saveTableState(OPT_OUT_SAVINGS_TABLE_KEY, {
			currentPage: this.currentPage(),
			searchText: this.searchText(),
		});

		const openInNewTab = false;
		const startDate = rowData.minDate ? moment.utc(rowData.minDate) : undefined;
		const endDate = rowData.maxDate ? moment.utc(rowData.maxDate) : undefined;
		const periodType = this.periodTypeMap[PeriodFilterTypeEnum.Custom];

		const dateRange =
			startDate && endDate
				? {
						startDate: moment(startDate).format(FormatDateConstants.YYYYMMDD),
						endDate: moment(endDate).format(FormatDateConstants.YYYYMMDD),
						period: this.commonGlobalService.mapPeriodToDetailPeriod(periodType),
				  }
				: undefined;

		this.commonGlobalService.navigateToFeeDetail(
			{
				feeId: rowData.feeId,
				bankId: rowData.clientId,
				origin: OPT_OUT_SAVINGS_BREADCRUMB,
				dateRange: dateRange,
			},
			openInNewTab
		);
	}

	get isNoMatchesState(): boolean {
		return !this.isloadingTable() && this.dataTable().length === 0 && this.searchText().length > 0;
	}

	get isNoDataState(): boolean {
		return !this.isloadingTable() && this.dataTable().length === 0 && this.searchText().length === 0;
	}

	public clearSearch(): void {
		this.tableFetch?.ClearSearch();
	}
}
