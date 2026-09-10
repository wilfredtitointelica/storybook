import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class LayoutResizeService {
	private sidebarChanged$ = new Subject<void>();
	notifySidebarChange() {
		this.sidebarChanged$.next();
	}
	onSidebarChange() {
		return this.sidebarChanged$.asObservable();
	}
}
