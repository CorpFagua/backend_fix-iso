import type { Prisma } from '@prisma/client';
import prisma from '../../config/database';

type RiskRow = { riskLevel: string };

type CompanySummaryRow = Prisma.CompanyGetPayload<{
  include: {
    sector: { select: { name: true } };
    companyControls: { select: { status: true } };
    riskAssessments: { select: { riskLevel: true } };
  };
}>;

export async function getStats(companyId?: number) {
  const where = companyId ? { companyId } : {};

  const [controls, assets, audits, risks] = await Promise.all([
    prisma.companyControl.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.asset.count({ where: companyId ? { companyId } : {} }),
    prisma.audit.count({
      where: {
        ...(companyId ? { companyId } : {}),
        status: 'planned',
      },
    }),
    prisma.assetRiskAssessment.findMany({
      where: companyId
        ? { asset: { companyId } }
        : {},
      select: { riskLevel: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const c of controls) statusMap[c.status] = c._count;

  const totalControls = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const implemented = statusMap['implemented'] ?? 0;
  const inProgress = statusMap['in_progress'] ?? 0;
  const pending = totalControls - implemented - inProgress;
  const compliancePercentage = totalControls > 0 ? Math.round((implemented / totalControls) * 100) : 0;

  const highRiskAssets = risks.filter((r: RiskRow) => r.riskLevel === 'high' || r.riskLevel === 'critical').length;

  // Determine overall risk level
  const criticalCount = risks.filter((r: RiskRow) => r.riskLevel === 'critical').length;
  const highCount = risks.filter((r: RiskRow) => r.riskLevel === 'high').length;
  let overallRiskLevel = 'low';
  if (criticalCount > 0) overallRiskLevel = 'critical';
  else if (highCount > 2) overallRiskLevel = 'high';
  else if (highCount > 0) overallRiskLevel = 'medium';

  return {
    totalControls,
    implementedControls: implemented,
    inProgressControls: inProgress,
    pendingControls: pending,
    compliancePercentage,
    totalAssets: assets,
    highRiskAssets,
    upcomingAudits: audits,
    overallRiskLevel,
  };
}

export async function getComplianceProgress(companyId?: number) {
  const controls = await prisma.companyControl.findMany({
    where: companyId ? { companyId } : {},
    include: { control: { include: { theme: { select: { name: true } } } } },
  });

  const themeMap: Record<string, { implemented: number; inProgress: number; pending: number; total: number }> = {};

  for (const cc of controls) {
    const theme = cc.control.theme.name;
    if (!themeMap[theme]) themeMap[theme] = { implemented: 0, inProgress: 0, pending: 0, total: 0 };
    themeMap[theme].total++;
    if (cc.status === 'implemented') themeMap[theme].implemented++;
    else if (cc.status === 'in_progress') themeMap[theme].inProgress++;
    else themeMap[theme].pending++;
  }

  return Object.entries(themeMap).map(([theme, data]) => ({ theme, ...data }));
}

export async function getRiskOverview(companyId?: number) {
  const risks = await prisma.assetRiskAssessment.findMany({
    where: companyId ? { asset: { companyId } } : {},
    select: { riskLevel: true },
  });

  const levels: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const r of risks) levels[r.riskLevel] = (levels[r.riskLevel] ?? 0) + 1;

  return Object.entries(levels).map(([level, count]) => ({ level, count }));
}

export async function getRecentActivity(companyId?: number) {
  const logs = await prisma.auditLog.findMany({
    where: companyId ? { entityType: 'company', entityId: companyId } : {},
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return logs.map(l => ({
    id: l.id,
    userName: l.user?.name ?? 'Sistema',
    action: l.action,
    entityType: l.entityType,
    description: `${l.action} en ${l.entityType}`,
    createdAt: l.createdAt,
  }));
}

export async function getGlobalSummary() {
  const companies = await prisma.company.findMany({
    include: {
      sector: { select: { name: true } },
      companyControls: { select: { status: true } },
      riskAssessments: { select: { riskLevel: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return companies.map((c: CompanySummaryRow) => {
    const total = c.companyControls.length;
    const implemented = c.companyControls.filter((cc: { status: string }) => cc.status === 'implemented').length;
    return {
      id: c.id,
      name: c.name,
      sectorName: c.sector.name,
      controlsTotal: total,
      controlsImplemented: implemented,
      compliancePercentage: total > 0 ? Math.round((implemented / total) * 100) : 0,
      riskLevel: c.riskAssessments[0]?.riskLevel ?? 'unknown',
    };
  });
}
