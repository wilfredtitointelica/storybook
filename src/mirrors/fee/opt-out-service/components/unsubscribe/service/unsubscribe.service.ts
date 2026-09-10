import { Injectable, signal } from "@angular/core";

@Injectable({
	providedIn: "root",
})
export class UnsubcribeService {
	public refresh = signal(0);

	trigger() {
		this.refresh.update(v => v + 1);
	}
}
