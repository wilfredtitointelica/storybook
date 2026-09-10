import { Injectable, inject } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";
import { RateTierItem } from "../dto/fee-detail.dto";
import { RateStructureEnum, SimulatorError } from "./enums";
import { FEE_DETAIL_TERM } from "./constants";
import { CommonGlobalService } from "../../common/services/common.service";

@Injectable({ providedIn: "root" })
export class FeeDetailCommonService {
	private readonly globalTermService = inject(GlobalTermService);
	private readonly commonGlobalService = inject(CommonGlobalService);

	private get dateLocale(): string {
		return this.globalTermService.languageCode?.toUpperCase() === "ES" ? "es-ES" : "en-US";
	}

	private readonly HIDDEN_STRUCTURES: ReadonlyArray<number> = [RateStructureEnum.Variable, RateStructureEnum.NotAvailable, RateStructureEnum.NotAssigned, RateStructureEnum.NotSpecified];

	public isStructureHidden(code: number | null): boolean {
		if (code === null) return true;
		return this.HIDDEN_STRUCTURES.includes(code);
	}

	public isEffectiveRate(code: number | null): boolean {
		return code === RateStructureEnum.ProgressiveTier;
	}

	public findMatchedTierIndices(events: number, tiers: RateTierItem[], code: number | null): Set<number> {
		if (code === null || tiers.length === 0) return new Set();

		if (code === RateStructureEnum.Flat || code === RateStructureEnum.Fixed) {
			return new Set([0]);
		}

		if (!Number.isFinite(events) || events <= 0) return new Set();

		if (code === RateStructureEnum.StandardTier || code === RateStructureEnum.FlatTier) {
			const idx = this.findReachedTierIndex(events, tiers);
			return idx >= 0 ? new Set([idx]) : new Set();
		}

		if (code === RateStructureEnum.ProgressiveTier) {
			const result = new Set<number>();
			for (let i = 0; i < tiers.length; i++) {
				result.add(i);
				const max = tiers[i].maximum ?? Number.POSITIVE_INFINITY;
				if (events <= max) break;
			}
			return result;
		}

		return new Set();
	}

	public calculateFeeAmount(events: number, tiers: RateTierItem[], code: number | null, minAmount: number | null, maxAmount: number | null): number | null {
		if (code === null || tiers.length === 0) return null;
		if (!Number.isFinite(events) || events <= 0) return null;

		const tierRate = (idx: number): number => {
			const num = Number(tiers[idx].rate);
			return Number.isFinite(num) ? num : 0;
		};

		let result: number | null = null;

		if (code === RateStructureEnum.Flat) {
			result = tierRate(0) * events;
		} else if (code === RateStructureEnum.Fixed) {
			result = tierRate(0);
		} else if (code === RateStructureEnum.StandardTier) {
			const idx = this.findReachedTierIndex(events, tiers);
			if (idx >= 0) result = tierRate(idx) * events;
		} else if (code === RateStructureEnum.FlatTier) {
			const idx = this.findReachedTierIndex(events, tiers);
			if (idx >= 0) result = tierRate(idx);
		} else if (code === RateStructureEnum.ProgressiveTier) {
			let sum = 0;
			for (let i = 0; i < tiers.length; i++) {
				const lowerBound = i === 0 ? 0 : (tiers[i - 1].maximum ?? 0);
				let upperBound = tiers[i].maximum ?? Number.POSITIVE_INFINITY;
				if (events < upperBound) upperBound = events;
				sum += (upperBound - lowerBound) * tierRate(i);
				if (lowerBound <= events && upperBound >= events) break;
			}
			result = sum;
		}

		if (result === null) return null;

		if (maxAmount !== null && maxAmount > 0 && result > maxAmount) result = maxAmount;
		if (minAmount !== null && minAmount > 0 && result < minAmount) result = minAmount;

		return result;
	}

	public getTierRateForEvents(events: number, tiers: RateTierItem[], code: number | null): number | null {
		if (code === null || tiers.length === 0) return null;
		if (code === RateStructureEnum.Flat || code === RateStructureEnum.Fixed) {
			const r = Number(tiers[0].rate);
			return Number.isFinite(r) ? r : null;
		}
		if (code === RateStructureEnum.StandardTier || code === RateStructureEnum.FlatTier) {
			if (!Number.isFinite(events) || events <= 0) return null;
			const idx = this.findReachedTierIndex(events, tiers);
			if (idx < 0) return null;
			const r = Number(tiers[idx].rate);
			return Number.isFinite(r) ? r : null;
		}
		return null;
	}

	public getTierUsedLabel(events: number, tiers: RateTierItem[], code: number | null): string {
		const indices = this.findMatchedTierIndices(events, tiers, code);
		if (indices.size === 0) return "";
		const tierNumbers = Array.from(indices)
			.sort((a, b) => a - b)
			.map(i => tiers[i].tier);
		const tierLabel = this.commonGlobalService.termText(FEE_DETAIL_TERM.TIER);
		return `${tierLabel} ${tierNumbers.join(",")}`;
	}

	public isInProgressNumeric(value: string): boolean {
		if (!/^[0-9]*\.?[0-9]*$/.test(value)) return false;
		const digitCount = value.replace(/[^0-9]/g, "").length;
		return digitCount <= 15;
	}

	public formatAmountInputDynamic(value: string | number | null, maxDecimals = 6): string {
		if (value == null || value === "") return "";
		const raw = typeof value === "string" ? this.parseFormattedNumber(value) : value;
		if (raw === null || !Number.isFinite(raw)) return "";
		return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxDecimals }).format(raw);
	}

	public parseFormattedNumber(value: string): number | null {
		if (!value) return null;
		const trimmed = value.trim();
		if (trimmed === "") return null;

		const hasDot = trimmed.includes(".");
		const commaCount = (trimmed.match(/,/g) ?? []).length;

		let normalized: string;
		if (commaCount === 0) {
			normalized = trimmed;
		} else if (hasDot || commaCount > 1) {
			normalized = trimmed.replace(/,/g, "");
		} else {
			const after = trimmed.split(",")[1];
			normalized = after.length === 3 ? trimmed.replace(",", "") : trimmed.replace(",", ".");
		}

		const num = Number(normalized);
		return Number.isFinite(num) ? num : null;
	}

	public validateNumericInput(value: string): SimulatorError | null {
		if (value === "") return null;
		if (/\s/.test(value)) return SimulatorError.InvalidFormat;
		const digitCount = value.replace(/[^0-9]/g, "").length;
		if (digitCount > 15) return SimulatorError.InvalidBasis;
		const num = this.parseFormattedNumber(value);
		if (num === null) return SimulatorError.InvalidFormat;
		if (num < 0) return SimulatorError.InvalidBasis;
		if (num > Number.MAX_SAFE_INTEGER) return SimulatorError.InvalidBasis;
		return null;
	}

	public formatEffectivePeriod(begin: string | null, end: string | null, version: string): string {
		const beginText = begin ? this.formatIsoDate(begin) : "";
		const endText = end ? this.formatIsoDate(end) : this.openEndedLabel(version);
		if (!beginText && !endText) return "";
		if (!beginText) return endText;
		return `${beginText} - ${endText}`;
	}

	private findReachedTierIndex(events: number, tiers: RateTierItem[]): number {
		return tiers.findIndex(t => {
			const min = t.minimum ?? 0;
			const max = t.maximum ?? Number.POSITIVE_INFINITY;
			return min <= events && events <= max;
		});
	}

	private formatIsoDate(iso: string): string {
		const parts = iso.split("T")[0].split("-").map(Number);
		const date = parts.length === 3 && parts.every(n => !isNaN(n)) ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(iso);
		if (isNaN(date.getTime())) return "";
		return new Intl.DateTimeFormat(this.dateLocale, {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(date);
	}

	private openEndedLabel(version: string): string {
		if (version === "Future") return this.commonGlobalService.termText(FEE_DETAIL_TERM.ONWARDS);
		if (version === "Previous") return "";
		return this.commonGlobalService.termText(FEE_DETAIL_TERM.PRESENT);
	}
}
