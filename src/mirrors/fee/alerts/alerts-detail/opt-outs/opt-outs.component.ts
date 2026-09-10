import { Component, input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
// components primeng
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { ProgressBarModule } from "primeng/progressbar";
import { Skeleton } from "primeng/skeleton";
// demos
import { DemoLoadedService } from "../../demo-loaded.service";
// library
import { AlertType } from "intelica-library-base";
// types / interface
interface TimelinesEvents {
	id: string;
	status: string;
	description?: string;
	date: string;
}
type Status = "running" | "completed" | "failed";
@Component({
	selector: "alerts-detail-opt-outs",
	templateUrl: "./opt-outs.component.html",
	imports: [CommonModule, Panel, Button, ProgressBarModule, Skeleton],
	providers: [DemoLoadedService],
})
export class AlertsDetailOptOutsComponent {
	// --- Inputs / Outputs ---
	context = input<AlertType>();
	// --- progressbar: random percent ---
	progressbarValue = signal<number>(this.GetProgressValuePercent());
	GetProgressValuePercent() {
		return Math.floor(Math.random() * 101); // 0 - 100
	}
	// --- progressbar: status class ---
	progressbarStatus = signal<string>(this.GetProgressStatusClass("failed"));
	GetProgressStatusClass(status: Status) {
		const map = {
			running: "in-progress",
			completed: "completed",
			failed: "error",
		};
		return map[status];
	}
	// --- paragraph truncate ---
	isParagraphTruncate = signal<boolean>(true);
	ToggleParagraphTruncate() {
		this.isParagraphTruncate.set(!this.isParagraphTruncate());
	}
	// --- timeline events ---
	timelineEvents = signal<TimelinesEvents[]>([
		{ id: "1", status: "Service Announced", description: "New digital wallet enhancement program to improve mobile payment experience and security.", date: "31 oct, 2025" },
		{ id: "2", status: "Free Trial Started", description: "rial period activated. Test enhanced features including tokenization and biometric authentication.", date: "29 nov, 2025" },
		{ id: "3", status: "Opt Out Deadline", description: "URGENT: Opt-out deadline is approaching. This is your last chance to decline enrollment.", date: "29 nov, 2025" },
	]);
	// --- demo loaded ---
	constructor(public demoLoaded: DemoLoadedService) {}
	ngOnInit() {
		this.demoLoaded.simulate();
	}
}
