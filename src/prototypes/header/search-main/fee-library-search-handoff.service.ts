import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";

const STORAGE_PREFIX = "fee.moduleFilters.";
const FEE_LIBRARY_SEARCH_HANDOFF_KEY = "FeeLibrarySearchHandoff";

interface FeeLibrarySearchHandoff {
	searchText: string;
}

// Puente Header -> Fee.External.Web: guarda en sessionStorage el texto buscado para que Fee Library
// lo consuma al montar y ejecute la busqueda ya filtrada. El prefijo y el algoritmo de clave replican
// exactamente ModuleFilterStateService (Fee.External.Web.New), y FEE_LIBRARY_SEARCH_HANDOFF_KEY debe
// coincidir con la misma constante alli para que ambos proyectos lean/escriban el mismo registro.
@Injectable({
	providedIn: "root",
})
export class FeeLibrarySearchHandoffService {
	private readonly configService = inject(ConfigService);

	public saveSearchText(searchText: string): void {
		const trimmedText = searchText.trim();
		if (!trimmedText) {
			return;
		}

		const handoff: FeeLibrarySearchHandoff = { searchText: trimmedText };
		try {
			sessionStorage.setItem(STORAGE_PREFIX + this.buildKey(), JSON.stringify(handoff));
		} catch {
			// sessionStorage no disponible: se omite el handoff, Fee Library usara sus filtros por defecto
		}
	}

	private buildKey(): string {
		return `${this.profileScope()}::${FEE_LIBRARY_SEARCH_HANDOFF_KEY}`;
	}

	private profileScope(): string {
		const session = this.configService.SessionInformation;
		const parts = [session?.businessUserID, session?.clientGroupID, session?.businessUserProfile].map(part => (part ?? "").trim()).filter(Boolean);

		return parts.length ? parts.join("|") : "anon";
	}
}
