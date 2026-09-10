import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
	name: "uploadDatePart",
	standalone: true,
})
export class UploadDatePartPipe implements PipeTransform {
	transform(value: string | null | undefined, part: "date" | "time" = "date"): string {
		if (!value) return "-";

		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return "-";

		if (part === "time") {
			return `${parsed.toLocaleTimeString("es-ES", {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})} hrs`;
		}

		const day = parsed.toLocaleDateString("es-ES", { day: "2-digit" });
		const month = parsed.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toLowerCase();
		const year = parsed.toLocaleDateString("es-ES", { year: "numeric" });
		return `${day} ${month}, ${year}`;
	}
}
