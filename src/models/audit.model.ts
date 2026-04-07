export type AuditStatus = 'planned' | 'in_progress' | 'completed';
export type AuditResultValue = 'not_evaluated' | 'compliant' | 'non_compliant';

export interface AuditListItem {
  id: number;
  companyId: number;
  auditorId: number;
  auditorName: string;
  date: string;
  status: AuditStatus;
  notes: string | null;
  totalControls: number;
  evaluatedCount: number;
  compliantCount: number;
  createdAt: string;
}

export interface AuditResultItem {
  id: number;
  controlId: number;
  code: string;
  title: string;
  themeName: string;
  themeId: number;
  result: AuditResultValue;
  comments: string | null;
  evidence: string | null;
}

export interface AuditDetailModel extends AuditListItem {
  results: AuditResultItem[];
}

export interface CreateAuditInput {
  date: string;
  notes?: string;
}

export interface UpdateAuditInput {
  status?: AuditStatus;
  notes?: string;
}

export interface UpdateAuditResultInput {
  result: AuditResultValue;
  comments?: string;
  evidence?: string;
}
