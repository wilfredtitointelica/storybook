export interface FileSharingResponse {
	fileId: number;
	fileNameOriginal: string;
	fileNameUser: string;
	fileNameSystem: string;
	filePath: string;
	categoryId: number | null;
	categoryName: string;
	fileDtUploadDate: string | null;
	fileSize: number | null;
	fileUploadedBy: string;
	fileDescription: string | null;
	userCompany: string;
	fileShared: number;
	fileCanDelete: number;
	flagDeleted: boolean;
	exeParams: string | null;
	sessionUser: string;
	flagPack: boolean;
	usersSharedByBank: string | null;
	fileExtension?: string;
	fileDownload: boolean;
	uploadedDateText?: string;
	fileSizeText?: string;
}
export interface FileCategoryResponse {
	categoryId: number;
	categoryDescription: string;
}
export interface PeriodFilterResponse {
	periodId: number;
	description: string;
	descriptionTerm: string;
	startDateDefault: Date;
	endDateDefault: Date;
}
export interface FileDateRangeResponse {
	minDate: string | null;
	maxDate: string | null;
}
