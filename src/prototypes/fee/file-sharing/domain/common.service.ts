import { inject, Injectable } from "@angular/core";
import { FileCategoryResponse, PeriodFilterResponse } from "../DTO/response";
import moment from "moment";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { FileSharingFilterRequest } from "../DTO/request";
import { ClientBankResponse } from "../../common/DTO/client-response";
@Injectable({
	providedIn: "root",
})
export class CommonService {
	private readonly config = inject(ConfigService);
	private readonly globalTermService = inject(GlobalTermService);
	private readonly datePickerLocaleEs = {
		firstDayOfWeek: 1,
		dayNames: ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"],
		dayNamesShort: ["dom", "lun", "mar", "mie", "jue", "vie", "sab"],
		dayNamesMin: ["D", "L", "M", "X", "J", "V", "S"],
		monthNames: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
		monthNamesShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
		today: "Hoy",
		clear: "Limpiar",
	};
	private readonly datePickerLocaleEn = {
		firstDayOfWeek: 0,
		dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
		dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		dayNamesMin: ["S", "M", "T", "W", "T", "F", "S"],
		monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
		monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
		today: "Today",
		clear: "Clear",
	};
	constructor(private readonly termPipe: TermPipe) {}

	termText(termCode: string): string {
		return this.termPipe.transform(termCode, this.globalTermService.languageCode);
	}

	buildAdvancedFilterChipLabel(categorySelected: number[] | undefined, listCategory: FileCategoryResponse[]): string {
		const ids = (categorySelected ?? []).filter(id => id !== -1);
		if (ids.length === 0 || (listCategory.length > 0 && ids.length >= listCategory.length)) return "";
		const value = ids.length === 1 ? (listCategory.find(c => c.categoryId === ids[0])?.categoryDescription ?? "") : `${ids.length} ${this.termText("LBL_SELECTED")}`;
		return `${this.termText("CATEGORY")}: ${value}`;
	}

	getDatePickerLocale() {
		return this.globalTermService.languageCode === "ES" ? this.datePickerLocaleEs : this.datePickerLocaleEn;
	}

	initSetFilterRequest(listPeriod: PeriodFilterResponse[], clientOptions: ClientBankResponse[]): FileSharingFilterRequest {
		const periodFind = listPeriod.find(f => (f.descriptionTerm || f.description).toUpperCase().includes("LAST12MONTHS")) || listPeriod[0];
		const today = new Date();
		return {
			fileName: "",
			periodId: periodFind?.periodId ?? -1,
			startDate: new Date(today.getFullYear(), today.getMonth() - 11, 1),
			endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
			categorySelected: [],
			clientIdsSelected: clientOptions.map(c => c.bankId),
		};
	}
	isArray(val: any) {
		const toString = {}.toString;
		return toString.call(val) === "[object Array]";
	}

	isObject(val: any) {
		return !this.isArray(val) && typeof val === "object" && !!val;
	}
	isNumber(value: any): boolean {
		return /^-?\d+(\.\d+)?$/.test(value);
	}
	evalMaxSize(fileSize: number, maxSize: string): boolean {
		const expression = /^\d+(kb|mb|gb|tb)$/i;
		if (!expression.test(maxSize)) {
			return false;
		}

		const numericPart = parseInt(maxSize);
		const unit = maxSize.replace(/\d+/g, "").toLowerCase();

		const unitMap: Record<string, number> = {
			kb: 1,
			mb: 2,
			gb: 3,
			tb: 4,
		};

		const pow = unitMap[unit];
		if (!pow) return false;

		const sizeToBytes = numericPart * Math.pow(1024, pow);
		return fileSize <= sizeToBytes;
	}
	convertFileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = error => reject(error);
		});
	}
	getListStatus(lenguajeCode: string = "EN"): string[] {
		let status: string[] = [];
		status = [
			this.termPipe.transform("SM_NOT_READY", lenguajeCode),
			this.termPipe.transform("SM_READY", lenguajeCode),
			this.termPipe.transform("SM_UPLOADING", lenguajeCode),
			this.termPipe.transform("SM_SENDING", lenguajeCode),
			this.termPipe.transform("SM_UPLOADED", lenguajeCode),
			this.termPipe.transform("SM_CANCELED", lenguajeCode),
			this.termPipe.transform("SM_NOT_VALID", lenguajeCode),
			this.termPipe.transform("SM_EXCEEDED_SIZE", lenguajeCode),
			this.termPipe.transform("SM_SENDING_SERVER", lenguajeCode),
			this.termPipe.transform("SM_NOT_VALID", lenguajeCode),
		];
		return status;
	}
	getDescriptionSubTitle(fileSharingFilteRequestTemp: FileSharingFilterRequest) {
		const start = moment(fileSharingFilteRequestTemp.startDate);
		const end = moment(fileSharingFilteRequestTemp.endDate);
		const formattedStart = start.format("DD MMM, YYYY").toLowerCase();
		const formattedEnd = end.format("DD MMM, YYYY").toLowerCase();
		return `${formattedStart} - ${formattedEnd}`;
	}
	isExtensionAllowed(file: File, extensionsAllowed: string): boolean {
		const dotIndex = file.name.lastIndexOf(".");
		const extension = file.name
			.substring(dotIndex >= 0 ? dotIndex : file.name.length)
			.toLowerCase()
			.trim();
		const extensionList = extensionsAllowed
			.split("|")
			.map(x => x.trim().toLowerCase())
			.filter(x => x.length > 0);
		return extensionList.length === 0 || extensionList.some(item => item === extension);
	}

	containsSpecialCharacters(value: string): boolean {
		const specialCharacter = /^[^\\/?%*:|"<>]+$/;
		return !specialCharacter.test(value);
	}

	sanitizeFileName(value: string): string {
		if (!value) return value;
		return this.containsSpecialCharacters(value) ? value.replace(/[\\/?%*:|"<>]/g, "") : value;
	}

	getUploadReadyTooltip(languageCode: string): string {
		return this.termPipe.transform("SM_READY", languageCode);
	}

	getUploadProcessedTooltip(languageCode: string): string {
		return this.termPipe.transform("LBL_FILE_PROCESSED", languageCode);
	}

	getInvalidUploadStatusTooltip(languageCode: string, maxFileSize: string, isExtensionValid?: boolean, isSizeValid?: boolean): string {
		if (isExtensionValid === false && isSizeValid === true) {
			return this.termPipe.transform("SM_FILE_TYPE_NOT_PERMITTED", languageCode);
		}

		if (isExtensionValid === true && isSizeValid === false) {
			return `${this.termPipe.transform("SM_FILE_SIZE_LIMIT_OF", languageCode)} (${maxFileSize})`;
		}

		return this.termPipe.transform("SM_TYPE_AND_SIZE_NOT_PERMITTED", languageCode);
	}
}
