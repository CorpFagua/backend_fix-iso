import prisma from '../../config/database';

type RiskRow = { riskLevel: string };

function calculateOverallRiskLevel(risks: RiskRow[]): string {
  const criticalCount = risks.filter(r => r.riskLevel === 'critical').length;
  const highCount = risks.filter(r => r.riskLevel === 'high').length;
  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (highCount > 0) return 'medium';
  return 'low';
}

export async function getStats(companyId?: number) {
  const where = companyId ? { companyId } : {};

  const [controls, assets, plannedAudits, completedAudits, risks, auditResults, implTasks] = await Promise.all([
    prisma.companyControl.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.asset.count({ where: companyId ? { companyId } : {} }),
    prisma.audit.count({
      where: { ...(companyId ? { companyId } : {}), status: 'planned' },
    }),
    prisma.audit.count({
      where: { ...(companyId ? { companyId } : {}), status: 'completed' },
    }),
    prisma.assetRiskAssessment.findMany({
      where: companyId ? { asset: { companyId } } : {},
      select: { riskLevel: true },
    }),
    prisma.auditResult.findMany({
      where: companyId ? { audit: { companyId } } : {},
      select: { result: true },
    }),
    prisma.implementationTask.findMany({
      where: companyId ? { companyControl: { companyId } } : {},
      select: { dimension: true, status: true },
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
  const overallRiskLevel = calculateOverallRiskLevel(risks);

  // Audit results
  const evaluatedControls = auditResults.length;
  const compliantControls = auditResults.filter(r => r.result === 'compliant').length;

  // Implementation tasks by dimension
  const dimensionMap: Record<string, { total: number; completed: number }> = {};
  for (const t of implTasks) {
    if (!dimensionMap[t.dimension]) dimensionMap[t.dimension] = { total: 0, completed: 0 };
    dimensionMap[t.dimension].total++;
    if (t.status === 'completed') dimensionMap[t.dimension].completed++;
  }
  const implementationByDimension = Object.entries(dimensionMap).map(([dimension, d]) => ({
    dimension,
    total: d.total,
    completed: d.completed,
    percentage: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }));

  return {
    totalControls,
    implementedControls: implemented,
    inProgressControls: inProgress,
    pendingControls: pending,
    compliancePercentage,
    totalAssets: assets,
    highRiskAssets,
    upcomingAudits: plannedAudits,
    completedAudits,
    evaluatedControls,
    compliantControls,
    overallRiskLevel,
    implementationByDimension,
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
  let where: Record<string, unknown> = {};

  if (companyId) {
    // Get all entity IDs related to this company
    const [controlIds, assetIds, auditIds] = await Promise.all([
      prisma.companyControl.findMany({ where: { companyId }, select: { id: true } }),
      prisma.asset.findMany({ where: { companyId }, select: { id: true } }),
      prisma.audit.findMany({ where: { companyId }, select: { id: true } }),
    ]);

    where = {
      OR: [
        { entityType: 'company', entityId: companyId },
        { entityType: 'company_control', entityId: { in: controlIds.map(c => c.id) } },
        { entityType: 'asset', entityId: { in: assetIds.map(a => a.id) } },
        { entityType: 'audit', entityId: { in: auditIds.map(a => a.id) } },
      ],
    };
  }

  const logs = await prisma.auditLog.findMany({
    where,
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
      assets: {
        select: {
          riskAssessments: { select: { riskLevel: true } },
        },
      },
    },
  });

  return companies.map(c => {
    const total = c.companyControls.length;
    const implemented = c.companyControls.filter(cc => cc.status === 'implemented').length;
    const allRisks = c.assets.flatMap(a => a.riskAssessments);
    return {
      id: c.id,
      name: c.name,
      sectorName: c.sector.name,
      controlsTotal: total,
      controlsImplemented: implemented,
      compliancePercentage: total > 0 ? Math.round((implemented / total) * 100) : 0,
      riskLevel: allRisks.length > 0 ? calculateOverallRiskLevel(allRisks) : 'unknown',
    };
  });
}
