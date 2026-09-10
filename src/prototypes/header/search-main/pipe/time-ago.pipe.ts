import { inject, Pipe, PipeTransform } from "@angular/core";
import { GlobalTermService } from "intelica-library-base";

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
	{ amount: 60, unit: "seconds" },
	{ amount: 60, unit: "minutes" },
	{ amount: 24, unit: "hours" },
	{ amount: 7, unit: "days" },
	{ amount: 4.34524, unit: "weeks" },
	{ amount: 12, unit: "months" },
	{ amount: Number.POSITIVE_INFINITY, unit: "years" },
];

@Pipe({
	name: "timeAgo",
	standalone: true,
	pure: false,
})
export class TimeAgoPipe implements PipeTransform {
	private readonly globalTermService = inject(GlobalTermService);

	transform(value: Date | string | number | null | undefined): string {
		if (!value) return "";

		const date = new Date(value);
		const locale = this.getLocale();
		const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

		let duration = (date.getTime() - Date.now()) / 1000;

		for (const division of DIVISIONS) {
			if (Math.abs(duration) < division.amount) {
				return formatter.format(Math.round(duration), division.unit);
			}
			duration /= division.amount;
		}

		return formatter.format(Math.round(duration), "years");
	}

	private getLocale(): string {
		const languageCode = this.globalTermService.languageCode?.toUpperCase();
		if (languageCode === "ES") return "es";
		if (languageCode === "EN") return "en";

		const lang = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
		return lang.startsWith("es") ? "es" : "en";
	}
}
