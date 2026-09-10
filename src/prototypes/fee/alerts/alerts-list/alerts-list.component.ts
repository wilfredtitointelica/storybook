import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Badge } from "primeng/badge";
import { Skeleton } from "primeng/skeleton";
import { Brand, ListItem, TotalItemsEvent } from "./dto/alerts-list.dto";
import { AlertsTab } from "../dto/alerts-commands.dto";
import { AlertType } from "../alerts-filter/dto/alerts-filter.dto";
import { AlertsService } from "../alerts.service";
import { AlertGroupCard, AlertsListResponse } from "../dto/alerts-responses.dto";
import { catchError, combineLatest, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from "rxjs";
import { StatusStateComponent, StatusStateEnum } from "intelica-library-project";

@Component({
	selector: "app-alerts-list",
	templateUrl: "./alerts-list.component.html",
	imports: [CommonModule, TermPipe, Badge, StatusStateComponent, Skeleton],
	providers: [TermPipe],
	styles: [
		`
			:host {
				display: block;
			}
		`,
	],
})
export class AlertsListComponent {
	private readonly alertsService = inject(AlertsService);
	private readonly termPipe = inject(TermPipe);
	public globalTermService = inject(GlobalTermService);
	public statusStateEnum = StatusStateEnum;

	AlertsTab = AlertsTab;

	// --- Inputs ---
	listType = input<AlertsTab>(AlertsTab.Inbox);
	activeTypes = input<AlertType[]>([]);
	selectedItem = input<ListItem | null>(null);
	markAsReadItem = input<ListItem | null>(null);
	searchText = input<string>("");
	dateRange = input<{ startDate: string | null; endDate: string | null }>({ startDate: null, endDate: null });
	bankIds = input<number[]>([]);
	isGroupProfile = input<boolean>(false);
	autoSelectId = input<string | null>(null);

	// --- Outputs ---
	selectItem = output<ListItem | null>();
	totalItems = output<TotalItemsEvent>();
	totalAvailableItems = output<TotalItemsEvent>();

	// --- State ---
	loading = signal(true);
	private removedIds = signal<Set<string>>(new Set());
	private viewedIdsLocal = signal<Set<string>>(new Set());
	private autoSelectDone = signal(false);

	// NUEVO: guarda el total real antes de búsquedas/filtros
	private initialTotalAvailable = signal<number | null>(null);

	// --- Reactive data flow ---
	private apiResponse = toSignal(
		combineLatest([
			toObservable(this.listType),
			toObservable(this.dateRange),
			toObservable(this.searchText).pipe(debounceTime(250)),
			toObservable(this.bankIds),
			toObservable(this.alertsService.refreshTrigger),
		]).pipe(
			map(([tab, range, search, bankIds, refresh]) => ({
				tab,
				range,
				search: search.trim(),
				bankIds,
				key: `${tab}-${range.startDate}-${range.endDate}-${search.trim()}-${bankIds.join("|")}-${refresh}`,
			})),
			distinctUntilChanged((a, b) => a.key === b.key),
			switchMap(({ tab, range, search, bankIds }) => {
				this.loading.set(true);
				this.initialTotalAvailable.set(null);
				this.removedIds.set(new Set());
				return this.alertsService
					.getAlerts({
						tab: tab === AlertsTab.Inbox ? "inbox" : "read",
						startDate: range.startDate ?? undefined,
						endDate: range.endDate ?? undefined,
						searchText: search || undefined,
						lang: this.globalTermService.languageCode || undefined,
						bankIds: bankIds.length ? bankIds.join("|") : undefined,
					})
					.pipe(
						catchError(() => of({ alerts: [], totalCount: 0, inboxCount: 0, readCount: 0 } as AlertsListResponse)),
						tap(response => {
							this.loading.set(false);

							// Guardamos el total real solamente cuando no hay búsqueda activa
							if (response) {
								const search = this.searchText().trim();

								if (!search) {
									this.initialTotalAvailable.set(this.listType() === AlertsTab.Inbox ? response.inboxCount : response.readCount);
								}
							}
						})
					);
			})
		),
		{ initialValue: null }
	);

	// --- Mapped items from API ---
	private listItems = computed(() => {
		const response = this.apiResponse();
		if (!response) return [];
		const tab = this.listType();
		return response.alerts.map(alert => this.mapAlertToListItem(alert, tab));
	});

	// --- Filtered by type + removed (search is applied server-side) ---
	currentItems = computed(() => {
		const types = this.activeTypes();
		const removed = this.removedIds();
		let items = this.listItems().filter(item => !removed.has(item.id));
		if (types.length) items = items.filter(item => types.includes(item.type));
		return items;
	});

	constructor() {
		// Emit total count
		effect(() => {
			const type = this.listType();
			const filteredTotal = this.currentItems().length;

			this.totalItems.emit({
				type,
				total: filteredTotal,
			});
		});

		effect(() => {
			const total = this.initialTotalAvailable();

			if (total === null) return;

			this.totalAvailableItems.emit({
				type: this.listType(),
				total,
			});
		});

		// Mark as read — only the Inbox list triggers the API call; the Read list ignores it
		effect(() => {
			const item = this.markAsReadItem();
			if (!item) return;
			if (this.listType() !== AlertsTab.Inbox) return;
			this.alertsService
				.markAsRead({
					alertIds: item.alertIds,
					alertType: item.alertType,
					clientId: item.bankid,
					createdRealDate: item.createdRealDate,
				})
				.pipe(catchError(() => of(void 0)))
				.subscribe(() => {
					this.removedIds.update(set => new Set([...set, item.id]));
				});
		});

		// Clear selection if item no longer visible
		effect(() => {
			const selected = this.selectedItem();
			const items = this.currentItems();
			if (!selected) return;
			if (!items.some(i => i.id === selected.id)) {
				this.selectItem.emit(null);
			}
		});

		// Auto-select item from URL query param ?id=<compositeId>
		effect(
			() => {
				if (this.autoSelectDone()) return;
				const id = this.autoSelectId();
				if (!id || this.loading()) return;
				const match = this.currentItems().find(i => i.id === id);
				if (match) {
					this.selectItem.emit(match);
					this.autoSelectDone.set(true);
				}
			},
			{ allowSignalWrites: true }
		);
	}

	onItemClick(item: ListItem) {
		if (this.listType() === AlertsTab.Inbox && item.isUnread && !item.isViewed) {
			this.viewedIdsLocal.update(set => (set.has(item.id) ? set : new Set([...set, item.id])));
			this.alertsService
				.markAsViewed({
					alertType: item.alertType,
					clientId: item.bankid,
					createdRealDate: item.createdRealDate,
					alertId: item.customAlertId,
				})
				.pipe(catchError(() => of(void 0)))
				.subscribe();
		}
		const selected = this.selectedItem();
		this.selectItem.emit(selected?.id === item.id ? null : item);
	}

	isItemUnread(item: ListItem): boolean {
		return item.folder === AlertsTab.Inbox && item.isUnread && !item.isViewed && !this.viewedIdsLocal().has(item.id);
	}

	private mapAlertToListItem(alert: AlertGroupCard, tab: AlertsTab): ListItem {
		const typeConfig = this.getTypeConfig(alert.alertType);
		const brands = alert.brands.map(b => b.toLowerCase() as Brand);
		const isCustom = alert.alertType === 4;
		const title = isCustom ? alert.feeName ?? "" : this.formatTitle(typeConfig.termKey, alert.billingDate, this.globalTermService.languageCode);
		const id = isCustom && alert.alertId != null ? `${alert.alertType}-${alert.bankId}-${alert.alertId}` : `${alert.alertType}-${alert.bankId}-${alert.createdRealDate}`;
		return {
			id,
			alertType: alert.alertType,
			createdRealDate: alert.createdRealDate,
			billingDate: alert.billingDate,
			titleTermKey: typeConfig.termKey,
			type: typeConfig.type,
			title,
			badge: { icon: typeConfig.icon, termKey: typeConfig.termKey },
			brands,
			date: this.formatShortDate(alert.createdRealDate, this.globalTermService.languageCode),
			totalCount: alert.totalCount,
			brandBreakdown: alert.brandBreakdown ?? null,
			totalAmount: alert.totalAmount,
			currencyCode: alert.currencyCode,
			klass: typeConfig.type,
			folder: tab,
			isUnread: !alert.isRead,
			isViewed: alert.isViewed,
			alertIds: [],
			customAlertId: alert.alertId ?? undefined,
			feeCode: alert.feeCode ?? undefined,
			configurationType: alert.configurationType ?? undefined,
			thresholdValue: alert.thresholdValue ?? undefined,
			thresholdUnit: alert.thresholdUnit ?? undefined,
			bankid: alert.bankId ?? undefined,
			bankName: alert.bankName ?? undefined,
		};
	}

	buildStats(item: ListItem, languageCode: string): string[] {
		// Custom: show fee code + rule (label + operator + value) per DRF-013
		if (item.alertType === 4) {
			const stats: string[] = [];
			if (item.feeCode) {
				const codeLabel = this.termPipe.transform("LBL_CODE", languageCode);
				stats.push(`${codeLabel}: ${item.feeCode}`);
			}
			const isExpected = item.configurationType === 1;
			const ruleLabel = this.termPipe.transform(isExpected ? "LBL_EXPECTED" : "LBL_VARIATION", languageCode);
			const operator = isExpected ? "=" : ">";
			const isPercentage = item.thresholdUnit === 2;
			if (item.thresholdValue != null) {
				const formatted = item.thresholdValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
				const valuePart = isPercentage ? `${formatted}%` : `${item.currencyCode ?? ""} ${formatted}`.trim();
				stats.push(`${ruleLabel} ${operator} ${valuePart}`);
			} else {
				stats.push(ruleLabel);
			}
			return stats;
		}
		const stats: string[] = [];
		const typeName = this.termPipe.transform(item.titleTermKey, languageCode);
		stats.push(`${typeName}: ${item.totalCount}`);
		if (item.brandBreakdown?.length) {
			for (const b of item.brandBreakdown) {
				stats.push(`${b.brandName}: ${b.count}`);
			}
		}
		if (item.totalAmount != null && item.currencyCode) {
			stats.push(`${item.currencyCode} ${item.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
		}
		return stats;
	}

	displayTitle(item: ListItem, languageCode: string): string {
		if (item.alertType === 4) return item.title;
		return this.formatTitle(item.titleTermKey, item.billingDate, languageCode);
	}

	formatTitle(termKey: string, billingDateIso: string, languageCode: string): string {
		const typeName = this.termPipe.transform(termKey, languageCode);
		const date = new Date(billingDateIso);
		const daysToMonday = date.getDay() === 0 ? 6 : date.getDay() - 1;
		const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToMonday);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(weekStart).replace(/\.$/, "");
		const day = weekStart.getDate();
		if (isSpanish) {
			return `${typeName} - Semana del ${day} de ${month}`;
		}
		return `${typeName} - Week of ${month} ${day}${this.daySuffix(day)}`;
	}

	private daySuffix(day: number): string {
		if (day === 1 || day === 21 || day === 31) return "st";
		if (day === 2 || day === 22) return "nd";
		if (day === 3 || day === 23) return "rd";
		return "th";
	}

	private getTypeConfig(alertType: number): { type: AlertType; icon: string; termKey: string } {
		const map: Record<number, { type: AlertType; icon: string; termKey: string }> = {
			1: { type: AlertType.NewFees, icon: "icon-invoice", termKey: "LBL_NEW_FEES" },
			2: { type: AlertType.Penalties, icon: "icon-warning", termKey: "LBL_PENALTIES" },
			3: { type: AlertType.OptOuts, icon: "icon-opt-out", termKey: "LBL_OPT_OUTS" },
			4: { type: AlertType.Custom, icon: "icon-custom", termKey: "LBL_CUSTOM" },
		};
		return map[alertType] ?? { type: AlertType.NewFees, icon: "icon-invoice", termKey: "LBL_ALERTS" };
	}

	formatShortDate(isoDate: string | undefined, languageCode: string): string {
		if (!isoDate) return "";
		const date = this.toLocalDateTime(isoDate);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(date).replace(/\.$/, "").toLowerCase();
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} ${month}, ${date.getFullYear()}`;
	}
	toLocalDateTime(value: string): Date {
		const cleanValue = value.replace("Z", "");

		const [datePart, timePart = "00:00:00"] = cleanValue.split("T");

		const [year, month, day] = datePart.split("-").map(Number);
		const [hour = 0, minute = 0, second = 0] = timePart.split(":").map(Number);

		return new Date(year, month - 1, day, hour, minute, second);
	}

	// --- Empty states ---
	hasNoData = computed(() => {
		const response = this.apiResponse();

		if (!response || this.loading()) return false;

		const totalAvailable = this.listType() === AlertsTab.Inbox ? response.inboxCount : response.readCount;

		return totalAvailable === 0 && !this.searchText().trim();
	});

	hasNoMatches = computed(() => {
		const response = this.apiResponse();

		if (!response || this.loading()) return false;

		const search = this.searchText().trim();

		return search.length > 0 && response.alerts.length === 0;
	});
}
