import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { ClientInformationResponse } from "../common/DTO/client-response";
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { InputText } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "primeng/tabs";
import { FilterBar } from "./filter-bar/filter-bar";
import { AlertsFilterComponent, DateRangeChange } from "./alerts-filter/alerts-filter.component";
import { AlertsListComponent } from "./alerts-list/alerts-list.component";
import { AlertsDetailComponent } from "./alerts-detail/alerts-detail.component";
import { AlertsTab } from "./dto/alerts-commands.dto";
import { ListItem, TotalItemsEvent } from "./alerts-list/dto/alerts-list.dto";
import { AlertType, getDefaultDateRange, toIsoDate } from "./alerts-filter/dto/alerts-filter.dto";
import { AlertsService } from "./alerts.service";

@Component({
	templateUrl: "./alerts.component.html",
	imports: [
		FormsModule,
		CommonModule,
		TermPipe,
		Panel,
		Button,
		InputText,
		IconField,
		InputIcon,
		AlertsFilterComponent,
		AlertsListComponent,
		AlertsDetailComponent,
		Tabs,
		TabList,
		TabPanels,
		Tab,
		TabPanel,
		FilterBar,
	],
	host: {
		class: "alert-management",
	},
})
export class AlertsComponent implements OnInit {
	private readonly alertsService = inject(AlertsService);
	private readonly configService = inject(ConfigService);
	private readonly route = inject(ActivatedRoute);
	public globalTermService = inject(GlobalTermService);

	AlertsTab = AlertsTab;
	tabValue = signal<AlertsTab>(AlertsTab.Inbox);
	// --- profile / client info ---
	readonly isGroupProfile = this.configService.SessionInformation?.isGroup ?? false;
	clientInfo = signal<ClientInformationResponse | null>(null);
	// --- search ---
	searchTextInbox = signal<string>("");
	searchTextRead = signal<string>("");
	// --- selected items ---
	selectedInboxItem = signal<ListItem | null>(null);
	selectedReadItem = signal<ListItem | null>(null);
	// --- detail state ---
	inboxDetailOpen = signal(false);
	readDetailOpen = signal(false);
	// --- total items ---
	inboxTotal = signal<number>(0);
	readTotal = signal<number>(0);
	// --- filtered items (search/filter result) ---
	inboxFilteredTotal = signal<number>(0);
	readFilteredTotal = signal<number>(0);
	// --- mark ---
	markAsReadItem = signal<ListItem | null>(null);
	// --- filter types ---
	inboxActiveTypes = signal<AlertType[]>([AlertType.NewFees, AlertType.Penalties, AlertType.Custom]);
	readActiveTypes = signal<AlertType[]>([AlertType.NewFees, AlertType.Penalties, AlertType.Custom]);
	// --- date range (global — afecta Inbox y Read por DRF-011) ---
	private static buildDefaultDateRange(): DateRangeChange {
		const { start, end } = getDefaultDateRange();
		return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
	}
	globalDateRange = signal<DateRangeChange>(AlertsComponent.buildDefaultDateRange());
	// --- selected banks (global — DRF-011) ---
	selectedBankIds = signal<number[]>([]);
	// --- export state ---
	exporting = signal(false);
	// --- auto-select from URL query param ?id=<alertId> ---
	autoSelectId = signal<string | null>(null);
	// --- search disabled ---
	readonly isDisabledSearch = computed(() => {
		return this.tabValue() === AlertsTab.Inbox ? this.inboxTotal() <= 0 : this.readTotal() <= 0;
	});
	ngOnInit(): void {
		const idParam = this.route.snapshot.queryParamMap.get("id");
		if (idParam) this.autoSelectId.set(idParam);

		if (!this.isGroupProfile) return;
		this.alertsService.getClientInformation().subscribe({
			next: response => this.clientInfo.set(response),
			error: () => this.clientInfo.set(null),
		});
	}

	onSelectItem(item: ListItem | null) {
		if (!item) {
			this.selectedInboxItem.set(null);
			this.selectedReadItem.set(null);
			this.inboxDetailOpen.set(false);
			this.readDetailOpen.set(false);
			return;
		}
		const isInbox = item.folder === AlertsTab.Inbox;
		const selectedSignal = isInbox ? this.selectedInboxItem : this.selectedReadItem;
		const detailSignal = isInbox ? this.inboxDetailOpen : this.readDetailOpen;
		if (selectedSignal()?.id === item.id) {
			detailSignal.update(v => !v);
			return;
		}
		selectedSignal.set(item);
		detailSignal.set(true);
	}

	onTotalItems(event: TotalItemsEvent) {
		if (event.type === AlertsTab.Inbox) {
			this.inboxFilteredTotal.set(event.total);
		}

		if (event.type === AlertsTab.Read) {
			this.readFilteredTotal.set(event.total);
		}
	}

	onTotalAvailableItems(event: TotalItemsEvent) {
		if (event.type === AlertsTab.Inbox) {
			this.inboxTotal.set(event.total);
		}

		if (event.type === AlertsTab.Read) {
			this.readTotal.set(event.total);
		}
	}

	onMarkAsRead(item: ListItem) {
		this.inboxDetailOpen.set(false);
		this.markAsReadItem.set(item);
	}

	onInboxFilterTypes(types: AlertType[]) {
		this.inboxActiveTypes.set(types);
		this.onCloseDetail(AlertsTab.Inbox);
	}

	onReadFilterTypes(types: AlertType[]) {
		this.readActiveTypes.set(types);
		this.onCloseDetail(AlertsTab.Read);
	}

	onInboxDateRange(range: DateRangeChange) {
		this.globalDateRange.set(range);
		this.onCloseDetail(AlertsTab.Inbox);
		this.onCloseDetail(AlertsTab.Read);
	}

	onReadDateRange(range: DateRangeChange) {
		this.globalDateRange.set(range);
		this.onCloseDetail(AlertsTab.Inbox);
		this.onCloseDetail(AlertsTab.Read);
	}

	onFilterBarDateRange(range: DateRangeChange) {
		this.globalDateRange.set(range);
		this.onCloseDetail(AlertsTab.Inbox);
		this.onCloseDetail(AlertsTab.Read);
	}

	onFilterBarBankIds(bankIds: number[]) {
		this.selectedBankIds.set(bankIds);
		this.onCloseDetail(AlertsTab.Inbox);
		this.onCloseDetail(AlertsTab.Read);
	}

	onInboxSearchChange(value: string) {
		this.searchTextInbox.set(value);
		this.onCloseDetail(AlertsTab.Inbox);
	}

	onReadSearchChange(value: string) {
		this.searchTextRead.set(value);
		this.onCloseDetail(AlertsTab.Read);
	}

	onTabChange(tab: AlertsTab) {
		this.tabValue.set(tab);
		this.onCloseDetail(AlertsTab.Inbox);
		this.onCloseDetail(AlertsTab.Read);
	}

	onCloseDetail(tab: AlertsTab) {
		if (tab === AlertsTab.Inbox) {
			this.selectedInboxItem.set(null);
			this.inboxDetailOpen.set(false);
		}
		if (tab === AlertsTab.Read) {
			this.selectedReadItem.set(null);
			this.readDetailOpen.set(false);
		}
	}

	onExport() {
		if (this.exporting()) return;
		const tab = this.tabValue() === AlertsTab.Inbox ? "inbox" : "read";
		const searchText = tab === "inbox" ? this.searchTextInbox() : this.searchTextRead();
		const activeTypes = tab === "inbox" ? this.inboxActiveTypes() : this.readActiveTypes();

		const alertTypeIdMap: Partial<Record<AlertType, number>> = {
			[AlertType.NewFees]: 1,
			[AlertType.Penalties]: 2,
			[AlertType.OptOuts]: 3,
			[AlertType.Custom]: 4,
		};
		const listActiveTypeIds = activeTypes.map(type => alertTypeIdMap[type]).filter((id): id is number => id !== undefined);
		const dateRange = this.globalDateRange();
		this.exporting.set(true);
		const bankIds = this.selectedBankIds();
		this.alertsService
			.exportAlerts({
				tab,
				searchText: searchText || undefined,
				startDate: dateRange.startDate ?? undefined,
				endDate: dateRange.endDate ?? undefined,
				alertType: listActiveTypeIds,
				bankIds: bankIds.length ? bankIds.join("|") : undefined,
			})
			.subscribe({
				next: response => {
					const blob = response.body!;
					const today = new Date();
					const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
					const filename = `alerts-${dateStr}.xlsx`;
					const url = URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = filename;
					a.click();
					URL.revokeObjectURL(url);
					this.exporting.set(false);
				},
				error: () => this.exporting.set(false),
			});
	}
}
