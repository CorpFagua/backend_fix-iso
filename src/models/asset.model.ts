export type AssetType =
  | 'information'
  | 'software'
  | 'hardware'
  | 'service'
  | 'people'
  | 'physical'
  | 'network'
  | 'intangible';

export type AssetClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RiskTreatment = 'mitigate' | 'accept' | 'transfer' | 'avoid';

export interface AssetModel {
  id: number;
  companyId: number;
  name: string;
  description: string | null;
  assetType: AssetType;
  classification: AssetClassification;
  ownerId: number;
  ownerName: string;
  custodianId: number | null;
  custodianName: string | null;
  location: string | null;
  status: string;
  risksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetWithRisksModel extends AssetModel {
  risks: AssetRiskModel[];
}

export interface AssetRiskModel {
  id: number;
  assetId: number;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  riskLevel: RiskLevel;
  treatment: RiskTreatment;
  treatmentPlan: string | null;
  residualRiskScore: number | null;
  assessedBy: number;
  assessedByName: string;
  createdAt: Date;
}

export interface CreateAssetInput {
  name: string;
  description?: string;
  assetType: AssetType;
  classification: AssetClassification;
  ownerId: number;
  custodianId?: number;
  location?: string;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  status?: string;
}

export interface CreateRiskInput {
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  treatment: RiskTreatment;
  treatmentPlan?: string;
}
