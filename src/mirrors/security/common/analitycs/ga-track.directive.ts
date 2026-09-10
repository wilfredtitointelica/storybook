import { Directive, ElementRef, Renderer2, effect, inject, input } from "@angular/core";
import { GA_TRACKING, GATrackingKey } from "./analytics.constants";
import { GATrackConfig, GATrackObjectConfig } from "./ga-track.types";

@Directive({
	selector: "[gaTrack]",
	standalone: true,
})
export class GaTrackDirective {
	// --------------------------------------
	// INPUT (signal-based)
	// --------------------------------------
	readonly gaTrack = input.required<GATrackConfig>();

	// --------------------------------------
	// INJECTS
	// --------------------------------------
	private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
	private readonly renderer = inject(Renderer2);

	// --------------------------------------
	// EFFECT (reactivo)
	// --------------------------------------
	constructor() {
		effect(() => {
			const raw = this.gaTrack();
			const config = this.normalize(raw);

			// ----------------------------------
			// CLASS (GTM mapping)
			// ----------------------------------
			const trackingClass = GA_TRACKING[config.key];
			this.renderer.addClass(this.el.nativeElement, trackingClass);

			// ----------------------------------
			// DATA ATTRIBUTES
			// ----------------------------------
			Object.entries(config).forEach(([key, value]) => {
				if (key === "key") return;
				if (value == null) return;
				this.renderer.setAttribute(this.el.nativeElement, `data-${this.toKebabCase(key)}`, String(value));
			});
		});
	}

	// --------------------------------------
	// NORMALIZE INPUT
	// --------------------------------------
	private normalize(config: GATrackConfig): GATrackObjectConfig {
		if (typeof config === "string") {
			return {
				key: config as GATrackingKey,
			};
		}
		return config;
	}

	// --------------------------------------
	// camelCase -> kebab-case
	// --------------------------------------
	private toKebabCase(value: string): string {
		return value.replace(/[A-Z]/g, l => `-${l.toLowerCase()}`);
	}
}
