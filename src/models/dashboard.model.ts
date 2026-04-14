import type { RiskLevel } from './asset.model';

export interface DashboardStatsModel {
  totalControls: number;
  implementedControls: number;
  inProgressControls: number;
  pendingControls: number;
  compliancePercentage: number;
  totalAssets: number;
  highRiskAssets: number;
  upcomingAudits: number;
  completedAudits: number;
  evaluatedControls: number;
  compliantControls: number;
  overallRiskLevel: RiskLevel | 'unknown';
  implementationByDimension: DimensionProgress[];
}

export interface DimensionProgress {
  dimension: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface ComplianceByThemeModel {
  theme: string;
  implemented: number;
  inProgress: number;
  pending: number;
  total: number;
}

export interface RiskOverviewModel {
  level: RiskLevel;
  count: number;
}

export interface RecentActivityModel {
  id: number;
  userName: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: Date;
}

export interface CompanySummaryModel {
  id: number;
  name: string;
  sectorName: string;
  controlsTotal: number;
  controlsImplemented: number;
  compliancePercentage: number;
  riskLevel: string;
}
