import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Select } from "primeng/select";
import { GlobalTermService } from "intelica-library-base";

interface LanguageItem {
	name: string;
	code: "ES" | "EN";
}

@Component({
	selector: "language",
	imports: [FormsModule, Select],
	templateUrl: "./language.html",
	styles: ``,
})
export class Language {
	private readonly globalTermService = inject(GlobalTermService);
	languages = signal<LanguageItem[]>([
		{ name: "Esp", code: "ES" },
		{ name: "Eng", code: "EN" },
	]);
	selectedLanguage = signal<LanguageItem>(this.languages().find((l) => l.code === this.globalTermService.languageCode) ?? this.languages()[0]);
	onLanguageChange(item: LanguageItem): void {
		console.log("[GTS-debug] combo onLanguageChange, item elegido:", item);
		this.selectedLanguage.set(item);
		this.globalTermService.SetLanguage(item.code);
	}
}
