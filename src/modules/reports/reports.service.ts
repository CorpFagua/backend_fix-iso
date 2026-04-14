import prisma from '../../config/database';

export interface CompanyReportData {
  company: { id: number; name: string; sectorName: string; country: string };
  generatedAt: string;
  compliance: {
    totalControls: number;
    implemented: number;
    inProgress: number;
    pending: number;
    compliancePercentage: number;
  };
  domainBreakdown: Array<{
    theme: string;
    implemented: number;
    inProgress: number;
    pending: number;
    total: number;
  }>;
  assets: {
    total: number;
    byRisk: Array<{ level: string; count: number }>;
    items: Array<{ name: string; type: string; classification: string; riskLevel: string; status: string }>;
  };
  audits: Array<{
    id: number;
    date: string;
    status: string;
    auditorName: string;
    totalControls: number;
    compliant: number;
    nonCompliant: number;
  }>;
}

export async function getCompanyReportData(companyId: number): Promise<CompanyReportData> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { sector: { select: { name: true } } },
  });
  if (!company) throw new Error('Empresa no encontrada');

  // Compliance
  const controls = await prisma.companyControl.findMany({
    where: { companyId },
    include: { control: { include: { theme: { select: { name: true } } } } },
  });

  const statusCount: Record<string, number> = {};
  const themeMap: Record<string, { implemented: number; inProgress: number; pending: number; total: number }> = {};

  for (const cc of controls) {
    statusCount[cc.status] = (statusCount[cc.status] ?? 0) + 1;
    const theme = cc.control.theme.name;
    if (!themeMap[theme]) themeMap[theme] = { implemented: 0, inProgress: 0, pending: 0, total: 0 };
    themeMap[theme].total++;
    if (cc.status === 'implemented') themeMap[theme].implemented++;
    else if (cc.status === 'in_progress') themeMap[theme].inProgress++;
    else themeMap[theme].pending++;
  }

  const totalControls = controls.length;
  const implemented = statusCount['implemented'] ?? 0;
  const inProgress = statusCount['in_progress'] ?? 0;
  const pending = totalControls - implemented - inProgress;
  const compliancePercentage = totalControls > 0 ? Math.round((implemented / totalControls) * 100) : 0;

  // Assets
  const assets = await prisma.asset.findMany({
    where: { companyId },
    include: { riskAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  const riskCounts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const assetItems = assets.map(a => {
    const topRisk = a.riskAssessments[0]?.riskLevel ?? 'none';
    if (topRisk in riskCounts) riskCounts[topRisk]++;
    return {
      name: a.name,
      type: a.assetType,
      classification: a.classification,
      riskLevel: topRisk,
      status: a.status,
    };
  });

  // Audits
  const audits = await prisma.audit.findMany({
    where: { companyId },
    include: {
      auditor: { select: { name: true } },
      results: { select: { result: true } },
    },
    orderBy: { date: 'desc' },
  });

  const auditsData = audits.map(a => ({
    id: a.id,
    date: a.date.toISOString().split('T')[0],
    status: a.status,
    auditorName: a.auditor.name,
    totalControls: a.results.length,
    compliant: a.results.filter(r => r.result === 'compliant').length,
    nonCompliant: a.results.filter(r => r.result === 'non_compliant').length,
  }));

  return {
    company: { id: company.id, name: company.name, sectorName: company.sector.name, country: company.country },
    generatedAt: new Date().toISOString(),
    compliance: { totalControls, implemented, inProgress, pending, compliancePercentage },
    domainBreakdown: Object.entries(themeMap).map(([theme, d]) => ({ theme, ...d })),
    assets: {
      total: assets.length,
      byRisk: Object.entries(riskCounts).map(([level, count]) => ({ level, count })),
      items: assetItems,
    },
    audits: auditsData,
  };
}
