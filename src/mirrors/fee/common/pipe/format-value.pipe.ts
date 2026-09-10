import { Pipe, PipeTransform } from "@angular/core";

export type TransformType = "amount" | "percent";

@Pipe({
	name: "formatValue",
})
export class FormatValuePipe implements PipeTransform {
	transform(value: number, type: TransformType = "amount", decimals: number = 2): string {
		if (value === null || value === undefined) return "";

		switch (type) {
			case "amount":
				return this.formatAmount(value, decimals);
			case "percent":
				return this.formatPercent(value, decimals);
			default:
				return value.toString();
		}
	}

	private formatAmount(value: number, decimals: number): string {
		const absValue = Math.abs(value);

		const suffixes = [
			{ limit: 1e12, suffix: "T" },
			{ limit: 1e9, suffix: "B" },
			{ limit: 1e6, suffix: "M" },
			{ limit: 1e3, suffix: "K" },
		];

		for (const { limit, suffix } of suffixes) {
			if (absValue >= limit) {
				return this.trimZeros((value / limit).toFixed(decimals)) + suffix;
			}
		}

		return this.trimZeros(value.toFixed(decimals));
	}

	private formatPercent(value: number, decimals?: number): string {
		if (decimals === undefined) {
			return this.trimZeros(value.toString()) + "%";
		}
		return this.trimZeros(value.toFixed(decimals)) + "%";
	}

	private trimZeros(value: string): string {
		return value.replace(/(\.\d*?[1-9])0+$/g, "$1").replace(/\.0+$/, "");
	}
}
