export interface TpeFilterDto {
	clientId: number;
	from: string;
	to: string;
	icas: string[];
}

export interface TpeCountryDto {
	countryId: number;
	countryName: string;
	clients: TpeClientDto[];
}

export interface TpeClientDto {
	clientId: number;
	clientName: string;
	clientCurrency: string;
	minDate: Date;
	maxDate: Date;
	lastUpdate: Date | null;
	disabledDates: Date[];
}
export interface ClientCountryTpeDto {
	clientId: number;
	clientName: string;
	clientCurrency: string;
	countryId: number;
	countryName: string;
	minDate: Date;
	maxDate: Date;
	lastUpdate: Date | null;
	disabled: boolean;
	disabledDates: Date[];
}
