export interface ClientInformationResponse {
  regions: ClientRegionResponse[];
  countries: ClientCountryResponse[];
  banks: ClientBankResponse[];
  groups: ClientGroupResponse[];
  brands: ClientBrandResponse[];
}

export interface ClientGroupResponse {
  groupId: number;
  groupName: string;
}

export interface ClientRegionResponse {
  regionId: number;
  regionName: string;
}

export interface ClientCountryResponse {
  countryId: number;
  countryName: string;
  regionId: number;
}

export interface ClientBankResponse {
  bankId: number;
  bankName: string;
  regionId: number;
  countryId: number;
}

export interface ClientBrandResponse {
  brandId: number;
  brandName: string;
}

export interface ClientRegionCountryBankResponse {
  countryName: string;
  bankName: string;
  regionId: number;
  countryId: number;
  bankId: number;
}

export interface ClientGroupBankResponse {
  groups: ClientGroupResponse[];
  banks: ClientBankResponse[];
}
