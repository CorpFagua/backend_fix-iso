import type { Prisma } from '@prisma/client';
import prisma from '../../config/database';

type AssetListRow = Prisma.AssetGetPayload<{
  include: {
    owner: { select: { name: true } };
    custodian: { select: { name: true } };
    _count: { select: { riskAssessments: true } };
  };
}>;

type RiskRow = Prisma.AssetRiskAssessmentGetPayload<{
  include: { assessor: { select: { name: true } } };
}>;

interface AssetsFilter {
  companyId: number;
  assetType?: string;
  classification?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getAssets(filter: AssetsFilter) {
  const where: Record<string, unknown> = { companyId: filter.companyId };
  if (filter.assetType) where.assetType = filter.assetType;
  if (filter.classification) where.classification = filter.classification;
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        custodian: { select: { name: true } },
        _count: { select: { riskAssessments: true } },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: items.map((a: AssetListRow) => ({
      id: a.id,
      companyId: a.companyId,
      name: a.name,
      description: a.description,
      assetType: a.assetType,
      classification: a.classification,
      ownerName: a.owner.name,
      ownerId: a.ownerId,
      custodianName: a.custodian?.name ?? null,
      custodianId: a.custodianId,
      location: a.location,
      status: a.status,
      risksCount: a._count.riskAssessments,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.ceil(total / filter.limit),
    },
  };
}

export async function getAssetById(companyId: number, id: number) {
  const a = await prisma.asset.findFirst({
    where: { id, companyId },
    include: {
      owner: { select: { name: true } },
      custodian: { select: { name: true } },
      riskAssessments: {
        include: { assessor: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!a) return null;

  return {
    id: a.id,
    companyId: a.companyId,
    name: a.name,
    description: a.description,
    assetType: a.assetType,
    classification: a.classification,
    ownerName: a.owner.name,
    ownerId: a.ownerId,
    custodianName: a.custodian?.name ?? null,
    custodianId: a.custodianId,
    location: a.location,
    status: a.status,
    risksCount: a.riskAssessments.length,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    risks: a.riskAssessments.map((r: RiskRow) => ({
      id: r.id,
      assetId: r.assetId,
      threat: r.threat,
      vulnerability: r.vulnerability,
      likelihood: r.likelihood,
      impact: r.impact,
      riskScore: r.riskScore,
      riskLevel: r.riskLevel,
      treatment: r.treatment,
      treatmentPlan: r.treatmentPlan,
      residualRiskScore: r.residualRiskScore,
      assessedByName: r.assessor.name,
      createdAt: r.createdAt,
    })),
  };
}

export async function createAsset(companyId: number, data: { name: string; description?: string; assetType: string; classification: string; ownerId: number; custodianId?: number; location?: string }) {
  const a = await prisma.asset.create({
    data: { companyId, ...data },
    include: {
      owner: { select: { name: true } },
      custodian: { select: { name: true } },
      _count: { select: { riskAssessments: true } },
    },
  });

  return {
    id: a.id,
    companyId: a.companyId,
    name: a.name,
    description: a.description,
    assetType: a.assetType,
    classification: a.classification,
    ownerName: a.owner.name,
    ownerId: a.ownerId,
    custodianName: a.custodian?.name ?? null,
    custodianId: a.custodianId,
    location: a.location,
    status: a.status,
    risksCount: a._count.riskAssessments,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export async function updateAsset(companyId: number, id: number, data: Record<string, unknown>) {
  const a = await prisma.asset.update({
    where: { id },
    data,
    include: {
      owner: { select: { name: true } },
      custodian: { select: { name: true } },
      _count: { select: { riskAssessments: true } },
    },
  });

  return {
    id: a.id,
    companyId: a.companyId,
    name: a.name,
    description: a.description,
    assetType: a.assetType,
    classification: a.classification,
    ownerName: a.owner.name,
    ownerId: a.ownerId,
    custodianName: a.custodian?.name ?? null,
    custodianId: a.custodianId,
    location: a.location,
    status: a.status,
    risksCount: a._count.riskAssessments,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export async function deleteAsset(id: number) {
  await prisma.asset.delete({ where: { id } });
}

export async function createRiskAssessment(assetId: number, userId: number, data: { threat: string; vulnerability: string; likelihood: number; impact: number; treatment: string; treatmentPlan?: string }) {
  const riskScore = data.likelihood * data.impact;
  let riskLevel = 'low';
  if (riskScore >= 20) riskLevel = 'critical';
  else if (riskScore >= 12) riskLevel = 'high';
  else if (riskScore >= 6) riskLevel = 'medium';

  const r = await prisma.assetRiskAssessment.create({
    data: {
      assetId,
      ...data,
      riskScore,
      riskLevel,
      assessedBy: userId,
    },
    include: { assessor: { select: { name: true } } },
  });

  return {
    id: r.id,
    assetId: r.assetId,
    threat: r.threat,
    vulnerability: r.vulnerability,
    likelihood: r.likelihood,
    impact: r.impact,
    riskScore: r.riskScore,
    riskLevel: r.riskLevel,
    treatment: r.treatment,
    treatmentPlan: r.treatmentPlan,
    residualRiskScore: r.residualRiskScore,
    assessedByName: r.assessor.name,
    createdAt: r.createdAt,
  };
}
