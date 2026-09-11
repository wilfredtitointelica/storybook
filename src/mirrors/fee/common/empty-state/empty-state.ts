import { Component, computed, inject, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { GlobalTermService, TermPipe } from "intelica-library-base";

export type EmptyStateType = "no-matches" | "no-data";

@Component({
	selector: "fee-empty-state",
	standalone: true,
	imports: [ButtonModule, TermPipe],
	templateUrl: "./empty-state.html",
})
export class EmptyStateComponent {
	private readonly globalTermService = inject(GlobalTermService);

	public type = input.required<EmptyStateType>();
	public searchText = input<string | null>("");
	public showClearSearch = input<boolean>(true);

	public clearSearch = output<void>();

	public readonly lang = computed(() => this.globalTermService.languageCode);

	public onClearSearch(): void {
		this.clearSearch.emit();
	}
}
