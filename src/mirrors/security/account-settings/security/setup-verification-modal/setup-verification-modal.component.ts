import { Component, computed, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// components
import { InputText } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
// term
import { GlobalTermService, TermPipe } from "intelica-library-base";

@Component({
	selector: "app-setup-verification-modal",
	standalone: true,
	imports: [FormsModule, CommonModule, InputText, IconField, Button, Message, TermPipe, Skeleton],
	templateUrl: "./setup-verification-modal.component.html",
})
export class SetupVerificationModalComponent {
	readonly termService = inject(GlobalTermService);
	readonly MAX_LENGTH = 6;
	// --- inputs ---
	qrCodeBase64 = input<string>("");
	manualEntryKey = input<string>("");
	isLoading = input<boolean>(false);
	hasError = input<boolean>(false);
	// --- output ---
	codeSubmitted = output<string>();
	// --- form: fields ---
	valueQrCode = signal<string>("");
	disabledButton = computed(() => this.valueQrCode().trim().length < this.MAX_LENGTH || this.isLoading());
	// --- methods ---
	NormalizeQrCode(event: Event) {
		const input = event.target as HTMLInputElement;
		const normalize = input.value.replace(/\D/g, "").slice(0, this.MAX_LENGTH);
		this.valueQrCode.set(normalize);
		input.value = normalize;
	}
	EnableTwoStepVerification() {
		this.codeSubmitted.emit(this.valueQrCode());
	}
}
