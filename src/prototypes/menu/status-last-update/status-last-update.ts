import { Component, inject, input, signal } from "@angular/core";
import { StatusLastUpdateHttpService } from "./status-last-update.service";
import { BrandLastUpdateResponse } from "./dto/status-last-update-responses";
import { CommonModule } from "@angular/common";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";

@Component({
	selector: "status-last-update",
	imports: [CommonModule, TermPipe],
	templateUrl: "./status-last-update.html",
})
export class StatusLastUpdate {
	private lastUpdateService = inject(StatusLastUpdateHttpService);
	public readonly globalTermService = inject(GlobalTermService);

	public lastUpdatedBrands = signal<BrandLastUpdateResponse[]>([]);
	private readonly ConfigService = inject(ConfigService);
	styleClass = input<string>("");
	collapsed = input<boolean>(false);

	constructor() {
		if (this.ConfigService.environment?.clientID === "ExternalNew") this.getBrands();
	}

	private getBrands() {
		this.lastUpdateService.getLastBrandUpdates().subscribe(response => this.lastUpdatedBrands.set(response));
	}

	getBrandIcon(id: number): string {
		switch (id) {
			case 1:
				return "icon-mastercard";
			case 2:
				return "icon-visa";
			case 3:
				return "icon-amex";
			default:
				return "icon-default";
		}
	}
}
