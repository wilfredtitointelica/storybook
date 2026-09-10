import { inject, Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { ButtonSeverity } from "primeng/button";
import { GlobalTermService, TermPipe } from "intelica-library-base";

export type ActionKind = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "URL" | "NAV" | "UNKNOWN";

@Injectable({ providedIn: "root" })
export class NotificationBellDomain {
	readonly GlobalTermService = inject(GlobalTermService);
	constructor(
		private readonly router: Router,
		private readonly http: HttpClient,
		public readonly termPipe: TermPipe
	) {}

	/**
	 * Navegación segura según tipo de URL
	 */
	safeNavigate(rawUrl: string | null | undefined): void {
		if (!rawUrl) return;

		const url = rawUrl.trim();
		if (!url) return;

		const lower = url.toLowerCase();

		// Permitir solo clicks sin URL (para acciones internas sin navegación)
		if (lower == "click") {
			//console.info("Only click:", url);
			return;
		}

		// 1) Bloquear esquemas peligrosos
		if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
			console.warn("Blocked unsafe url:", url);
			return;
		}

		// 2) Esquemas especiales
		if (lower.startsWith("mailto:") || lower.startsWith("tel:")) {
			window.location.href = url;
			return;
		}

		// 3) URLs externas explícitas
		if (lower.startsWith("http://") || lower.startsWith("https://")) {
			window.open(url, "_blank", "noopener,noreferrer");
			return;
		}

		// 4) Protocol-relative: //example.com
		if (lower.startsWith("//")) {
			window.open(`${window.location.protocol}${url}`, "_blank", "noopener,noreferrer");
			return;
		}

		// 5) www.example.com → asumir https
		if (lower.startsWith("www.")) {
			window.open(`https://${url}`, "_blank", "noopener,noreferrer");
			return;
		}

		// 6) Todo lo demás se considera interno (SPA)
		const internalPath = url.startsWith("/") ? url : `/${url}`;
		this.router.navigateByUrl(internalPath);
	}

	/**
	 * Normaliza el tipo de acción
	 */
	normalizeActionType(raw: string | null | undefined): ActionKind {
		const v = (raw ?? "").trim().toUpperCase();

		// HTTP
		if (v === "POST") return "POST";
		if (v === "PUT") return "PUT";
		if (v === "PATCH") return "PATCH";
		if (v === "DELETE") return "DELETE";
		if (v === "GET") return "GET";

		// Navegación
		if (v === "URL") return "URL";
		if (v === "NAV" || v === "ROUTE" || v === "ROUTER") return "NAV";

		return "UNKNOWN";
	}

	/**
	 * Ejecuta acciones HTTP
	 */
	async executeHttpAction(method: ActionKind, destination: string, body: any): Promise<void> {
		switch (method) {
			case "POST":
				await firstValueFrom(this.http.post(destination, body));
				return;

			case "PUT":
				await firstValueFrom(this.http.put(destination, body));
				return;

			case "PATCH":
				await firstValueFrom(this.http.patch(destination, body));
				return;

			case "DELETE":
				await firstValueFrom(this.http.request("DELETE", destination, { body }));
				return;

			case "GET":
				await firstValueFrom(this.http.get(destination));
				return;

			default:
				return;
		}
	}

	getTimeAgo(date: Date | string): string {
		if (!date) return "";

		const now = new Date().getTime();
		const past = new Date(date).getTime();

		const diffMs = now - past;
		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffSeconds < 60) {
			if (this.GlobalTermService.languageCode === "es") {
				return "Ahora";
			}
			return "Now";
		}

		if (diffMinutes < 60) {
			if (this.GlobalTermService.languageCode === "es") {
				return `Hace ${diffMinutes}m`;
			}
			return `${diffMinutes}m ago`;
		}

		if (diffHours < 24) {
			if (this.GlobalTermService.languageCode === "es") {
				return `Hace ${diffHours}h`;
			}
			return `${diffHours}h ago`;
		}

		if (diffDays < 7) {
			if (this.GlobalTermService.languageCode === "es") {
				return `Hace ${diffDays}d`;
			}
			return `${diffDays}d ago`;
		}

		return new Date(date).toLocaleDateString();
	}

	getJsonData(data: any): any {
		const body = JSON.parse(data ?? "{}");
		return body;
	}

	getSeverity(value: any): any {
		return value ? value : "secondary";
	}

	getTerm(termCode: string): string {
		var term = this.termPipe.transform(termCode, this.GlobalTermService.languageCode);
		return term;
	}
}
