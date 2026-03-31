export interface IsoThemeModel {
  id: number;
  name: string;
  description: string | null;
  controlsCount: number;
}

export interface IsoControlModel {
  id: number;
  code: string;
  title: string;
  description: string;
  themeId: number;
  themeName: string;
  controlType: string;
  properties: string;
  version: string;
}

export interface CompanyControlModel {
  id: number;
  companyId: number;
  controlId: number;
  code: string;
  title: string;
  themeName: string;
  status: string;
  maturityLevel: string;
  compliancePercentage: number;
  assignedUserId: number | null;
  assignedUserName: string | null;
  implementationDate: Date | null;
  reviewDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoAEntryModel {
  controlId: number;
  code: string;
  title: string;
  themeName: string;
  applicable: boolean;
  justification: string | null;
  implementationStatus: string;
}

export type CompanyControlStatus =
  | 'pending'
  | 'in_progress'
  | 'implemented'
  | 'non_compliant'
  | 'under_review';

export type MaturityLevel =
  | 'initial'
  | 'managed'
  | 'defined'
  | 'measured'
  | 'optimized';

export interface UpdateCompanyControlInput {
  status?: CompanyControlStatus;
  maturityLevel?: MaturityLevel;
  compliancePercentage?: number;
  assignedUser?: number;
  notes?: string;
  reviewDate?: string;
}

export interface AssignControlInput {
  controlId: number;
  status?: CompanyControlStatus;
  maturityLevel?: MaturityLevel;
  assignedUser?: number;
  notes?: string;
}

export interface UpdateSoAInput {
  applicable: boolean;
  justification?: string;
  implementationStatus?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
