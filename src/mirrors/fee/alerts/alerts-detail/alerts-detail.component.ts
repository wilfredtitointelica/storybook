import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { GlobalTermService, TermPipe } from "intelica-library-base";
import { AlertsDetailNewFeesComponent } from "./new-fees/new-fees.component";
import { AlertsDetailPenaltiesComponent } from "./penalties/penalties.component";
import { AlertsDetailCustomComponent } from "./custom/custom.component";
import { Badge } from "primeng/badge";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
import { ListItem } from "../alerts-list/dto/alerts-list.dto";
import { AlertsTab } from "../dto/alerts-commands.dto";
import { AlertType } from "../alerts-filter/dto/alerts-filter.dto";
import { AlertGroupDetailResponse } from "../dto/alerts-responses.dto";
import { AlertsService } from "../alerts.service";
import { catchError, of } from "rxjs";

@Component({
	selector: "app-alerts-detail",
	templateUrl: "./alerts-detail.component.html",
	imports: [CommonModule, TermPipe, Badge, Button, Skeleton, AlertsDetailNewFeesComponent, AlertsDetailPenaltiesComponent, AlertsDetailCustomComponent],
	providers: [TermPipe],
})
export class AlertsDetailComponent {
	private readonly alertsService = inject(AlertsService);
	private readonly termPipe = inject(TermPipe);
	public globalTermService = inject(GlobalTermService);

	AlertType = AlertType;

	// --- Inputs / Outputs ---
	item = input<ListItem | null>(null);
	open = input<boolean>(false);
	isGroupProfile = input<boolean>(false);
	close = output<void>();
	markAsRead = output<ListItem>();
	isRead = computed(() => this.item()?.folder === AlertsTab.Read);

	// --- State ---
	detailData = signal<AlertGroupDetailResponse | null>(null);
	loading = signal(false);

	constructor() {
		effect(() => {
			const item = this.item();
			if (!item) {
				this.detailData.set(null);
				return;
			}
			this.loading.set(true);
			this.alertsService
				.getAlertDetail({
					alertType: item.alertType,
					createdRealDate: item.createdRealDate,
					clientId: item.bankid,
					alertId: item.customAlertId,
				})
				.pipe(catchError(() => of(null)))
				.subscribe(data => {
					this.detailData.set(data);
					this.loading.set(false);
				});
		});
	}

	onMarkAsRead() {
		const item = this.item();
		const data = this.detailData();
		if (!item || !data) return;
		const alertIds = data.fees.map(f => f.alertId);
		this.markAsRead.emit({ ...item, alertIds });
	}

	displayTitle(item: ListItem | null, languageCode: string): string {
		if (!item) return "";
		if (item.alertType === 4) return item.title;
		return this.formatTitle(item.titleTermKey, item.billingDate, languageCode);
	}

	formatTitle(termKey: string | undefined, billingDateIso: string | undefined, languageCode: string): string {
		if (!termKey || !billingDateIso) return "";
		const typeName = this.termPipe.transform(termKey, languageCode);
		const date = this.toLocalDateTime(billingDateIso);
		const daysToMonday = date.getDay() === 0 ? 6 : date.getDay() - 1;
		const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysToMonday);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(weekStart).replace(/\.$/, "");
		const day = weekStart.getDate();
		if (isSpanish) {
			return `${typeName} - Semana del ${day} de ${month}`;
		}
		return `${typeName} - Week of ${month} ${day}${this.daySuffix(day)}`;
	}

	private daySuffix(day: number): string {
		if (day === 1 || day === 21 || day === 31) return "st";
		if (day === 2 || day === 22) return "nd";
		if (day === 3 || day === 23) return "rd";
		return "th";
	}

	formatShortDate(isoDate: string | undefined, languageCode: string): string {
		if (!isoDate) return "";
		const date = this.toLocalDateTime(isoDate);
		const isSpanish = languageCode?.toLowerCase() === "es";
		const month = new Intl.DateTimeFormat(isSpanish ? "es-ES" : "en-US", { month: "short" }).format(date).replace(/\.$/, "").toLowerCase();
		const day = String(date.getDate()).padStart(2, "0");
		return `${day} ${month}, ${date.getFullYear()}`;
	}
	toLocalDateTime(value: string): Date {
		const cleanValue = value.replace('Z', '');
	  
		const [datePart, timePart = '00:00:00'] = cleanValue.split('T');
	  
		const [year, month, day] = datePart.split('-').map(Number);
		const [hour = 0, minute = 0, second = 0] = timePart.split(':').map(Number);
	  
		return new Date(year, month - 1, day, hour, minute, second);
	  }
}
