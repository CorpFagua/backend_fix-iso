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

// ─── Trainings Report ───────────────────────────────────────────────────────

export interface TrainingsReportEnrollment {
  userId: number;
  userName: string;
  userEmail: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
}

export interface TrainingsReportItem {
  id: number;
  trainingId: number;
  title: string;
  trainingType: string;
  assignedAt: string;
  assignedByName: string;
  totalEnrolled: number;
  totalCompleted: number;
  enrollments: TrainingsReportEnrollment[];
}

export interface TrainingsReportData {
  company: { id: number; name: string };
  generatedAt: string;
  items: TrainingsReportItem[];
}

export async function getTrainingsReportData(companyId: number): Promise<TrainingsReportData> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  if (!company) throw new Error('Empresa no encontrada');

  const companyTrainings = await prisma.companyTraining.findMany({
    where: { companyId },
    include: {
      training: { select: { id: true, title: true, trainingType: true } },
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      assignedByUser: { select: { name: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  const items: TrainingsReportItem[] = companyTrainings.map(ct => ({
    id: ct.id,
    trainingId: ct.training.id,
    title: ct.training.title,
    trainingType: ct.training.trainingType,
    assignedAt: ct.assignedAt.toISOString().split('T')[0],
    assignedByName: ct.assignedByUser.name,
    totalEnrolled: ct.enrollments.length,
    totalCompleted: ct.enrollments.filter(e => e.status === 'COMPLETED').length,
    enrollments: ct.enrollments.map(e => ({
      userId: e.userId,
      userName: e.user.name,
      userEmail: e.user.email,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString().split('T')[0],
      completedAt: e.completedAt ? e.completedAt.toISOString().split('T')[0] : null,
    })),
  }));

  return { company: { id: company.id, name: company.name }, generatedAt: new Date().toISOString(), items };
}

// ─── Audits Report ──────────────────────────────────────────────────────────

export interface AuditsReportResult {
  controlId: number;
  code: string;
  title: string;
  themeName: string;
  result: string;
  comments: string | null;
}

export interface AuditsReportAudit {
  id: number;
  date: string;
  status: string;
  auditorName: string;
  notes: string | null;
  totalControls: number;
  compliant: number;
  nonCompliant: number;
  notEvaluated: number;
  results: AuditsReportResult[];
}

export interface AuditsReportData {
  company: { id: number; name: string };
  generatedAt: string;
  audits: AuditsReportAudit[];
}

export async function getAuditsReportData(companyId: number): Promise<AuditsReportData> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  if (!company) throw new Error('Empresa no encontrada');

  const audits = await prisma.audit.findMany({
    where: { companyId },
    include: {
      auditor: { select: { name: true } },
      results: {
        include: {
          control: { include: { theme: { select: { name: true } } } },
        },
        orderBy: { control: { code: 'asc' } },
      },
    },
    orderBy: { date: 'desc' },
  });

  const auditsData: AuditsReportAudit[] = audits.map(a => {
    const results: AuditsReportResult[] = a.results.map(r => ({
      controlId: r.controlId,
      code: r.control.code,
      title: r.control.title,
      themeName: r.control.theme.name,
      result: r.result,
      comments: r.comments,
    }));
    return {
      id: a.id,
      date: a.date.toISOString().split('T')[0],
      status: a.status,
      auditorName: a.auditor.name,
      notes: a.notes,
      totalControls: results.length,
      compliant: results.filter(r => r.result === 'compliant').length,
      nonCompliant: results.filter(r => r.result === 'non_compliant').length,
      notEvaluated: results.filter(r => r.result === 'not_evaluated').length,
      results,
    };
  });

  return { company: { id: company.id, name: company.name }, generatedAt: new Date().toISOString(), audits: auditsData };
}

// ─── Implementation Report ──────────────────────────────────────────────────

export interface ImplementationReportDimension {
  key: string;
  label: string;
  status: string;
}

export interface ImplementationReportControl {
  code: string;
  title: string;
  themeName: string;
  status: string;
  maturityLevel: string;
  progressPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
  assignedUserName: string | null;
  dimensions: ImplementationReportDimension[];
}

export interface ImplementationReportDomain {
  themeName: string;
  totalControls: number;
  progressPercentage: number;
}

export interface ImplementationReportData {
  company: { id: number; name: string };
  generatedAt: string;
  summary: { totalControls: number; progressPercentage: number };
  byDomain: ImplementationReportDomain[];
  controls: ImplementationReportControl[];
}

const DIMENSION_LABELS: Record<string, string> = {
  policy: 'Política',
  procedures: 'Procedimientos',
  technical: 'Implementación técnica',
  evidence: 'Evidencia y registros',
  training: 'Capacitación',
  monitoring: 'Monitoreo y revisión',
};

const DIMENSION_KEYS = ['policy', 'procedures', 'technical', 'evidence', 'training', 'monitoring'];

export async function getImplementationReportData(companyId: number): Promise<ImplementationReportData> {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  if (!company) throw new Error('Empresa no encontrada');

  const companyControls = await prisma.companyControl.findMany({
    where: { companyId },
    include: {
      control: { include: { theme: { select: { name: true } } } },
      assignedUser: { select: { name: true } },
      implementationTasks: { select: { dimension: true, status: true } },
    },
    orderBy: { control: { code: 'asc' } },
  });

  const themeMap: Record<string, { totalSlots: number; completed: number; controlCount: number }> = {};

  const controls: ImplementationReportControl[] = companyControls.map(cc => {
    const tasks = cc.implementationTasks;
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = DIMENSION_KEYS.length;
    const progressPercentage = tasks.length > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    const themeName = cc.control.theme.name;
    if (!themeMap[themeName]) themeMap[themeName] = { totalSlots: 0, completed: 0, controlCount: 0 };
    themeMap[themeName].controlCount++;
    themeMap[themeName].totalSlots += totalTasks;
    themeMap[themeName].completed += tasksCompleted;

    const dimensions: ImplementationReportDimension[] = DIMENSION_KEYS.map(key => {
      const task = tasks.find(t => t.dimension === key);
      return { key, label: DIMENSION_LABELS[key] ?? key, status: task?.status ?? 'not_started' };
    });

    return {
      code: cc.control.code,
      title: cc.control.title,
      themeName,
      status: cc.status,
      maturityLevel: cc.maturityLevel,
      progressPercentage,
      tasksCompleted,
      totalTasks,
      assignedUserName: cc.assignedUser?.name ?? null,
      dimensions,
    };
  });

  const byDomain: ImplementationReportDomain[] = Object.entries(themeMap).map(([themeName, v]) => ({
    themeName,
    totalControls: v.controlCount,
    progressPercentage: v.totalSlots > 0 ? Math.round((v.completed / v.totalSlots) * 100) : 0,
  })).sort((a, b) => a.themeName.localeCompare(b.themeName));

  const globalSlots = byDomain.reduce((s, d) => s + d.totalControls * DIMENSION_KEYS.length, 0);
  const globalCompleted = controls.reduce((s, c) => s + c.tasksCompleted, 0);
  const progressPercentage = globalSlots > 0 ? Math.round((globalCompleted / globalSlots) * 100) : 0;

  return {
    company: { id: company.id, name: company.name },
    generatedAt: new Date().toISOString(),
    summary: { totalControls: controls.length, progressPercentage },
    byDomain,
    controls,
  };
}
