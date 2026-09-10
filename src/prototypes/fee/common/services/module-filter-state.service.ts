import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";

// Servicio reutilizable para recordar, por modulo (clave = pageRoot de la ruta), los ultimos
// filtros aplicados. Cada modulo guarda su propio snapshot (tab, filtros, periodo, etc.) con save()
// y lo recupera al abrirse con get(). Respaldado en memoria + sessionStorage: sobrevive la navegacion
// dentro de la pestana y un F5, pero se limpia al cerrar el navegador (vuelve a defaults).
//
// El estado se namespacea por usuario + grupo + perfil, de modo que al cambiar de perfil/cliente o al
// entrar otro usuario, la clave cambia y NO se recuperan filtros de un contexto distinto (arranca en defaults).
@Injectable({ providedIn: "root" })
export class ModuleFilterStateService {
	private readonly config = inject(ConfigService);
	private readonly prefix = "fee.moduleFilters.";
	private readonly memory = new Map<string, unknown>();

	save<T>(pageRoot: string, state: T): void {
		const key = this.buildKey(pageRoot);
		if (!key) {
			return;
		}

		this.memory.set(key, state);
		try {
			sessionStorage.setItem(this.prefix + key, JSON.stringify(state));
		} catch {
			// sessionStorage no disponible: queda solo en memoria
		}
	}

	get<T>(pageRoot: string): T | null {
		const key = this.buildKey(pageRoot);
		if (!key) {
			return null;
		}

		if (this.memory.has(key)) {
			return this.memory.get(key) as T;
		}

		try {
			const raw = sessionStorage.getItem(this.prefix + key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	}

	clear(pageRoot: string): void {
		const key = this.buildKey(pageRoot);
		if (!key) {
			return;
		}

		this.memory.delete(key);
		try {
			sessionStorage.removeItem(this.prefix + key);
		} catch {
			// noop
		}
	}

	private buildKey(pageRoot: string): string {
		if (!pageRoot) {
			return "";
		}

		return `${this.profileScope()}::${pageRoot}`;
	}

	private profileScope(): string {
		const session = this.config.SessionInformation;
		const parts = [session?.businessUserID, session?.clientGroupID, session?.businessUserProfile].map(part => (part ?? "").trim()).filter(Boolean);

		return parts.length ? parts.join("|") : "anon";
	}
}
