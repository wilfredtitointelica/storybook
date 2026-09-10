import { Component, inject, signal, viewChild } from "@angular/core";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { Popover, PopoverModule } from "primeng/popover";
import { SearchForm } from "./search-form/search-form";
import { SearchResult } from "./search-result/search-result";
@Component({
	selector: "search-main",
	imports: [Popover, TermPipe, PopoverModule, SearchForm, SearchResult],
	templateUrl: "./search-main.html",
})
export class SearchMain {
	public globalTermService = inject(GlobalTermService);
	popoverSearchResult = viewChild<Popover>("popoverSearchResult");

	isPopoverOpen = signal(false);

	OpenSearchResult(et: { event: Event; target: HTMLElement }) {
		const popover = this.popoverSearchResult();
		if (!this.isPopoverOpen()) {
			popover?.show(et.event, et.target);
			this.isPopoverOpen.set(true);
		}
	}

	CloseSearchResult() {
		this.popoverSearchResult()?.hide();
		this.isPopoverOpen.set(false);
	}
}
