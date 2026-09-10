import { HttpClient, HttpEvent, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "intelica-library-base";
import { FileSharingFilterRequest, FileTableRequest, InputFileRequest } from "../file-sharing/DTO/request";
import { FileCategoryResponse, FileDateRangeResponse, FileSharingResponse, PeriodFilterResponse } from "../file-sharing/DTO/response";
import { catchError, Observable, of } from "rxjs";
import { FileSharingConstants } from "../file-sharing/common/constants";
import { ClientInformationResponse } from "../common/DTO/client-response";

@Injectable({
	providedIn: "root",
})
export class FileSharingService {
	private readonly http = inject(HttpClient);
	private readonly configService = inject(ConfigService);
	constructor() {}
	listFileSharing(fileSharingFilteRequest: FileSharingFilterRequest): Observable<FileSharingResponse[]> {
		const params = new HttpParams()
			.set("FileName", fileSharingFilteRequest.fileName ?? "")
			.set("PeriodId", fileSharingFilteRequest.periodId.toString())
			.set("StartDate", fileSharingFilteRequest.startDate.toISOString())
			.set("EndDate", fileSharingFilteRequest.endDate.toISOString())
			.set("CategorySelected", (fileSharingFilteRequest.categorySelected ?? []).join("|"))
			.set("ClientIdsSelected", (fileSharingFilteRequest.clientIdsSelected ?? []).join("|"));
		return this.http.get<FileSharingResponse[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.LIST_FILE_SHARING}`, { params });
	}

	getListPeriod(): Observable<PeriodFilterResponse[]> {
		const params = new HttpParams().set("granularity", "ranges");
		return this.http.get<PeriodFilterResponse[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.GET_DATE_RANGE_PERIOD}`, { params });
	}
	getListCategory(): Observable<FileCategoryResponse[]> {
		return this.http.get<FileCategoryResponse[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.LIST_CATEGORY}`);
	}
	uploadFile(inputFileRequest: InputFileRequest): Observable<HttpEvent<any>> {
		return this.http.post(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.UPLOAD_FILE}`, inputFileRequest, {
			reportProgress: true,
			observe: "events",
		});
	}
	SendUploadNotification(uploadedFiles: FileTableRequest[]): Observable<boolean> {
		return this.http.post<boolean>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.SEND_UPLOAD_NOTIFICATION}`, uploadedFiles);
	}

	deleteFiles(fileSelected: FileSharingResponse[], deleteShared: number): Observable<any> {
		const payload = {
			files: fileSelected.map(f => f.fileId),
			deleteShared: deleteShared,
		};

		return this.http.delete(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.DELETE_FILE}`, {
			body: payload,
		});
	}
	downloadFile(fileSelected: FileSharingResponse[]): Observable<HttpEvent<Blob>> {
		let params = new HttpParams();
		fileSelected.forEach(file => {
			params = params.append("fileIds", file.fileId.toString());
		});

		return this.http.get(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.DOWNLOAD_MULTIPLE_FILE}`, {
			params,
			observe: "events",
			reportProgress: true,
			responseType: "blob",
		});
	}
	GetPropertiesPage(): Observable<any[]> {
		return this.http.get<any[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.GET_PROPERTIES_PAGE}`).pipe(catchError(err => of(err)));
	}

	ListFileAlertById(fileAlertId: number): Observable<FileSharingResponse[]> {
		return this.http.get<FileSharingResponse[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${fileAlertId}`).pipe(catchError(err => of(err)));
	}
	GetClientInformation(): Observable<ClientInformationResponse> {
		return this.http.get<any[]>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.GET_CLIENT_INFORMATION}`).pipe(catchError(err => of(err)));
	}
	GetDateRange(): Observable<FileDateRangeResponse | null> {
		return this.http.get<FileDateRangeResponse>(`${this.configService.environment?.feePath}/${FileSharingConstants.BASE_URL}/${FileSharingConstants.DATE_RANGE}`).pipe(catchError(() => of(null)));
	}
}
