import { computed, effect, inject, Injectable, signal } from "@angular/core";
import moment from "moment";
import { finalize } from "rxjs";
import { FiltersTpeResponse } from "../dto/tpe-responses.dto";
import { TpeService } from "../tpe.service";
import { ClientCountryTpeDto, TpeFilterDto } from "./dto/tpe-filter.dto";
import { ModuleFilterStateService } from "../../common/services/module-filter-state.service";

export const TPE_DATE_PRESETS = {
	CURRENT_MONTH: "currentMonth",
	CURRENT_YEAR: "currentYear",
	LAST_12_MONTHS: "last12Months",
	CUSTOM: "custom",
} as const;

export type TpeDatePreset = (typeof TPE_DATE_PRESETS)[keyof typeof TPE_DATE_PRESETS];
export interface TpeFilterSession extends TpeFilterDto {
	preset: TpeDatePreset | null;
}

export interface TpeTableState {
	currentPage: number;
	searchText: string | null;
}

type TpeDateRange = { from: string; to: string };
type ClientBounds = { min: moment.Moment; max: moment.Moment };

const DATE_FORMAT = "YYYY-MM-DD";
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LAST_12_MONTHS_OFFSET = 11;
const EMPTY_RANGE: TpeDateRange = { from: "", to: "" };
const TPE_PAGE_ROOT = "TPE";
const TPE_FILTER_STATE_KEY = `${TPE_PAGE_ROOT}.filter`;
const tpeTableStateKey = (tableKey: string) => `${TPE_PAGE_ROOT}.table.${tableKey}`;

@Injectable({
	providedIn: "root",
})
export class TpeFilterService {
	private _filter = signal<TpeFilterDto>({ clientId: 0, from: "", to: "", icas: [] });
	private _filterTemp = signal<TpeFilterDto>({ clientId: 0, from: "", to: "", icas: [] });
	private _filterOptions = signal<FiltersTpeResponse | null>(null);
	private _filterOptionsApply = signal<FiltersTpeResponse | null>(null);
	private _isLoadingClients = signal<boolean>(true);
	private _isLoadingFilters = signal<boolean>(true);
	private _activePreset = signal<TpeDatePreset | null>(null);
	private _activePresetTemp = signal<TpeDatePreset | null>(null);
	private _client = signal<ClientCountryTpeDto[]>([]);
	private _pendingFilterRequests = signal(0);
	private _isNoData = signal<boolean>(false);

	public filter = this._filter.asReadonly();
	public filterTemp = this._filterTemp.asReadonly();
	public filterOptions = this._filterOptions.asReadonly();
	public filterOptionsApply = this._filterOptionsApply.asReadonly();
	public activePreset = this._activePreset.asReadonly();
	public activePresetTemp = this._activePresetTemp.asReadonly();
	public clients = this._client.asReadonly();
	public isLoadingClients = this._isLoadingClients.asReadonly();
	public isLoadingFilters = this._isLoadingFilters.asReadonly();
	public isApplying = computed(() => this._pendingFilterRequests() > 0);
	public isNoData = this._isNoData.asReadonly();

	public beginFilterRequest(): void {
		this._pendingFilterRequests.update(n => n + 1);
	}

	public endFilterRequest(): void {
		this._pendingFilterRequests.update(n => Math.max(0, n - 1));
	}

	private readonly clientsById = computed(() => new Map(this.clients().map(client => [client.clientId, client])));

	public selectedClientTemp = computed<ClientCountryTpeDto | null>(() => this.getClientById(this._filterTemp().clientId));

	private readonly tpeService = inject(TpeService);
	private readonly moduleFilterState = inject(ModuleFilterStateService);

	private hasHydrated = false;
	private lastFiltersQueryKey = "";

	private sessionFilter = this.moduleFilterState.get<TpeFilterSession>(TPE_FILTER_STATE_KEY);
	private isFirstChargeFilter = true;

	constructor() {
		this.getClients();
		this.setupGetFiltersEffect();
	}

	public getClients() {
		this._isLoadingClients.set(true);
		this.tpeService.getClients().subscribe({
			next: clientCountriesResponse => {
				const clientCountries: ClientCountryTpeDto[] = clientCountriesResponse.map(item => ({
					...item,
					minDate: this.parseDateSafe(item.minDate),
					maxDate: this.parseDateSafe(item.maxDate),
					lastUpdate: this.parseDateSafe(item.lastUpdate),
					disabledDates: this.getDisabledDates(item.minDate, item.maxDate, item.enabledDates),
					disabled: !item.enabledDates.length,
				}));
				clientCountries.sort((a, b) => a.clientName.localeCompare(b.clientName));
				this._client.set(clientCountries);
				const initialClient = this.resolveInitialClient();

				if (!initialClient) {
					this._isLoadingClients.set(false);
					this._isLoadingFilters.set(false);
					this._isNoData.set(true);
					return;
				}
				this.hydrateInitialFilter(initialClient);
			},
		});
	}

	public getFilters(client: number, from: string, to: string) {
		this._isLoadingFilters.set(true);
		this.tpeService
			.getFilters({ client, from, to })
			.pipe(finalize(() => this._isLoadingFilters.set(false)))
			.subscribe({
				next: filters => {
					this._filterOptions.set(filters);
					this._filterTemp.update(temp => ({ ...temp, icas: filters.icas }));
					if (this.isFirstChargeFilter) {
						this.updateDependsFilters();
						this.applyFilter();
						this.isFirstChargeFilter = false;
					}
				},
			});
	}

	public updateDependsFilters() {
		const { icas: optionsIcas } = this._filterOptions()!;
		const { icas: sessionIcas } = this.sessionFilter ?? {};

		if (sessionIcas?.length) {
			const allValid = sessionIcas.every(sessionIca => optionsIcas.some(optionIca => optionIca === sessionIca));
			this.applyIcas(allValid ? sessionIcas : []);
		}
	}

	public updateFilterTemp(partial: Partial<TpeFilterDto>) {
		this._filterTemp.set({ ...this._filterTemp(), ...partial });
	}

	public applyFilter() {
		const temp = this._filterTemp();
		const icas = temp.icas;
		const normalized = { ...temp, icas };

		this._filterTemp.set(normalized);
		this._filter.set(normalized);
		this._filterOptionsApply.set(this._filterOptions());
		this._activePreset.set(this._activePresetTemp());
		this.sessionFilter = { ...normalized, preset: this._activePreset() };
		this.moduleFilterState.save(TPE_FILTER_STATE_KEY, this.sessionFilter);
	}

	public clearFilter(): void {
		this.applyPreset(TPE_DATE_PRESETS.CURRENT_YEAR);
		this.applyFilter();
	}

	public icaOptions(): string[] {
		const filters = this.filterOptions();
		return filters?.icas ?? [];
	}

	public selectClient(clientId: number, isHidrate: boolean = false): void {
		const selected = this.getClientById(clientId);
		if (!selected) return;

		this.updateFilterTemp({ clientId: selected.clientId });

		const { preset, icas } = this.sessionFilter ?? {};
		const dates = !preset ? this.getDatesFromRange(this.sessionFilter) : null;

		if (preset) this.applyPreset(preset);
		else if (dates) this.applyDateRange(dates);
		else this.applyPreset(TPE_DATE_PRESETS.CURRENT_YEAR);

		if (!icas?.length && !isHidrate) this.applyFilter();
	}

	public applyPreset(preset: TpeDatePreset): void {
		const selected = this.selectedClientTemp();
		if (!selected) return;
		const { from, to } = this.getPresetRange(selected, preset);
		this.updateFilterTemp({ from, to });
		this._activePresetTemp.set(preset);
	}

	public applyDateRange(range: [Date, Date] | Date[] | null): void {
		if (!range || range.length < 2) return;
		const [from, to] = range;
		if (!(from instanceof Date) || !(to instanceof Date)) return;
		this.updateFilterTemp({ from: moment(from).format(DATE_FORMAT), to: moment(to).format(DATE_FORMAT) });
		this._activePresetTemp.set(null);
	}

	public applyIcas(icas: string[]): void {
		const icasTemp = this._filterTemp().icas;
		const equal = icasTemp.length === icas.length && icasTemp.every(v => icas.includes(v));
		if (!equal) this.updateFilterTemp({ icas });
	}

	public parseDateSafe(value: string): Date {
		if (!value) return new Date(NaN);
		const match = value?.match(DATE_ONLY_PATTERN);
		if (!match) return new Date(NaN);
		const year = Number(match[1]);
		const month = Number(match[2]);
		const day = Number(match[3]);
		const date = new Date(year, month - 1, day);
		const isSameCalendarDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
		return isSameCalendarDate ? date : new Date(NaN);
	}

	public getPresetRange(client: ClientCountryTpeDto, preset: TpeDatePreset): TpeDateRange {
		const bounds = this.getClientBounds(client);
		if (!bounds) return EMPTY_RANGE;

		const { min, max } = bounds;
		const anchor = moment.min(moment(), max);

		let from: moment.Moment;
		let to: moment.Moment;

		switch (preset) {
			case TPE_DATE_PRESETS.CURRENT_MONTH:
				from = anchor.clone().startOf("month");
				to = anchor.clone().endOf("month");
				break;
			case TPE_DATE_PRESETS.LAST_12_MONTHS:
				from = anchor.clone().subtract(LAST_12_MONTHS_OFFSET, "months").startOf("month");
				to = anchor.clone();
				break;
			default:
				from = anchor.clone().startOf("year");
				to = anchor.clone();
				break;
		}

		if (from.isBefore(min)) from = min.clone();
		if (to.isAfter(max)) to = max.clone();
		if (to.isBefore(from)) to = from.clone();

		const adjusted = this.adjustRangeWithDisabled(new Date(from.year(), from.month(), from.date()), new Date(to.year(), to.month(), to.date()), this.getDisabledDateSet(client));
		return { from: this.formatDateKey(adjusted.from), to: this.formatDateKey(adjusted.to) };
	}

	public getDatesFromRange(range: TpeDateRange | null | undefined): Date[] | undefined {
		if (!range?.from || !range.to) return undefined;
		const from = this.parseDateSafe(range.from);
		const to = this.parseDateSafe(range.to);
		return this.isValidDate(from) && this.isValidDate(to) ? [from, to] : undefined;
	}

	public isRangeSelectedInDates(dates: Date[] | undefined, range: TpeDateRange | null | undefined): boolean {
		if (!range?.from || !range.to) return false;
		if (!dates || dates.length < 2) return false;
		const [from, to] = dates;
		if (!this.isValidDate(from) || !this.isValidDate(to)) return false;
		return this.formatDateKey(from) === range.from && this.formatDateKey(to) === range.to;
	}

	private getClientBounds(client: ClientCountryTpeDto): ClientBounds | null {
		const min = moment(client.minDate);
		const max = moment(client.maxDate);
		if (!min.isValid() || !max.isValid()) return null;
		return { min, max };
	}

	private getDisabledDates(minDate: string, maxDate: string, enabledDates: string[]): Date[] {
		if (!enabledDates.length) return [];

		const min = this.parseDateSafe(minDate)!;
		const max = this.parseDateSafe(maxDate)!;

		if (Number.isNaN(min.getTime()) || Number.isNaN(max.getTime())) return [];

		const enabledSet = new Set(
			enabledDates
				.map(d => this.parseDateSafe(d)!)
				.filter(d => !Number.isNaN(d.getTime()))
				.map(d => this.formatDateKey(d))
		);

		const disabledDates: Date[] = [];
		const current = new Date(min.getFullYear(), min.getMonth(), min.getDate());
		const end = new Date(max.getFullYear(), max.getMonth(), max.getDate());

		while (current.getTime() <= end.getTime()) {
			const currentStr = this.formatDateKey(current);
			if (!enabledSet.has(currentStr)) disabledDates.push(new Date(current.getTime()));
			current.setDate(current.getDate() + 1);
		}
		return disabledDates;
	}

	private formatDateKey(date: Date): string {
		const year = date.getFullYear().toString().padStart(4, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private isValidDate(value: Date | null | undefined): value is Date {
		return value instanceof Date && !Number.isNaN(value.getTime());
	}

	private getDisabledDateSet(client: ClientCountryTpeDto): Set<string> {
		const disabledDates = client.disabledDates ?? [];
		if (disabledDates.length === 0) return new Set<string>();
		const set = new Set<string>();
		for (const date of disabledDates) {
			if (date instanceof Date && !Number.isNaN(date.getTime())) set.add(this.formatDateKey(date));
		}
		return set;
	}

	private adjustRangeWithDisabled(from: Date, to: Date, disabledSet: Set<string>): { from: Date; to: Date } {
		if (disabledSet.size === 0) return { from, to };
		const adjustedFrom = this.findNextEnabled(from, to, disabledSet);
		const adjustedTo = this.findPrevEnabled(to, from, disabledSet);
		if (!adjustedFrom || !adjustedTo) return { from, to };
		if (adjustedFrom.getTime() > adjustedTo.getTime()) {
			return { from: adjustedFrom, to: adjustedFrom };
		}
		return { from: adjustedFrom, to: adjustedTo };
	}

	private findNextEnabled(start: Date, end: Date, disabledSet: Set<string>): Date | null {
		const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
		const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
		while (current.getTime() <= endDate.getTime()) {
			if (!disabledSet.has(this.formatDateKey(current))) {
				return new Date(current.getTime());
			}
			current.setDate(current.getDate() + 1);
		}
		return null;
	}

	private findPrevEnabled(start: Date, end: Date, disabledSet: Set<string>): Date | null {
		const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
		const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
		while (current.getTime() >= endDate.getTime()) {
			if (!disabledSet.has(this.formatDateKey(current))) {
				return new Date(current.getTime());
			}
			current.setDate(current.getDate() - 1);
		}
		return null;
	}

	private setupGetFiltersEffect(): void {
		effect(() => {
			const { clientId, from, to } = this._filterTemp();
			if (!this.hasHydrated || !clientId || !from || !to) return;
			const key = `${clientId}|${from}|${to}`;
			if (key === this.lastFiltersQueryKey) return;
			this.lastFiltersQueryKey = key;
			this.getFilters(clientId, from, to);
		});
	}

	private hydrateInitialFilter(initialClient: ClientCountryTpeDto): void {
		const selectedClient = initialClient;
		this.hasHydrated = true;
		this.selectClient(selectedClient.clientId, true);
		this._isLoadingClients.set(false);
	}

	private resolveInitialClient(): ClientCountryTpeDto | null {
		const clients = this.clients().filter(x => !x.disabled);
		if (clients.length === 0) return null;
		const client = clients.find(c => c.clientId === this.sessionFilter?.clientId) ?? clients[0];
		if (this.sessionFilter?.clientId != client?.clientId) {
			this.moduleFilterState.clear(TPE_FILTER_STATE_KEY);
			this.sessionFilter = null;
		}
		return client;
	}

	private getClientById(clientId: number): ClientCountryTpeDto | null {
		return this.clientsById()?.get(clientId) ?? null;
	}

	private areSameStringArrays(left: string[], right: string[]): boolean {
		if (left.length !== right.length) return false;
		return left.every((value, index) => value === right[index]);
	}

	public restoreTempFilter(): void {
		this._filterTemp.set(this._filter());
		this._activePresetTemp.set(this._activePreset());
	}

	public saveTableState(tableKey: string, state: TpeTableState): void {
		this.moduleFilterState.save(tpeTableStateKey(tableKey), state);
	}

	public getTableState(tableKey: string): TpeTableState | null {
		const key = tpeTableStateKey(tableKey);
		const state = this.moduleFilterState.get<TpeTableState>(key);
		if (state) {
			this.moduleFilterState.clear(key);
		}
		return state;
	}

	public clearTableState(tableKey: string): void {
		this.moduleFilterState.clear(tpeTableStateKey(tableKey));
	}
}
