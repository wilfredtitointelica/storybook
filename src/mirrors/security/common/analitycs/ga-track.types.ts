import { GATrackingKey } from "./analytics.constants";

// --------------------------------------
// OBJECT MODE (avanzado)
// --------------------------------------
export interface GATrackObjectConfig {
	/**
	 * Key centralizada
	 * usada para obtener la clase tracking
	 */
	key: GATrackingKey;
	/**
	 * Metadata dinámica
	 * convertida automáticamente
	 * a data-*
	 */
	[key: string]: unknown;
}

// --------------------------------------
// INPUT TYPE (simple + advanced)
// --------------------------------------
export type GATrackConfig = GATrackingKey | GATrackObjectConfig;
