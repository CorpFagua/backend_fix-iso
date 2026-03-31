export interface CompanyModel {
  id: number;
  name: string;
  sectorId: number;
  sectorName: string;
  sizeId: number;
  sizeName: string;
  country: string;
  status: string;
  engagementStart: Date | null;
  engagementEnd: Date | null;
  createdBy: number;
  createdAt: Date;
}

export interface CompanyUserModel {
  companyId: number;
  userId: number;
  userName: string;
  userEmail: string;
  roleInCompany: string | null;
  assignedAt: Date;
}

export interface CompanyServiceModel {
  id: number;
  companyId: number;
  serviceType: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
}
