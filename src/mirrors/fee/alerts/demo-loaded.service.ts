import { Injectable, signal } from "@angular/core";
// @Injectable({ providedIn: "root" })
@Injectable()
export class DemoLoadedService {
	ready = signal(false);

	simulate(delay = 2000) {
		setTimeout(() => this.ready.set(true), delay);
	}

	reset() {
		this.ready.set(false);
	}
}
