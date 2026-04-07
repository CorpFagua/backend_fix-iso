import prisma from '../../config/database';
import type {
  AuditListItem,
  AuditDetailModel,
  AuditResultItem,
  CreateAuditInput,
  UpdateAuditInput,
  UpdateAuditResultInput,
} from '../../models/audit.model';

interface ListAuditsFilter {
  companyId: number;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listAudits(filter: ListAuditsFilter) {
  const { companyId, status, page = 1, limit = 20 } = filter;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { companyId };
  if (status) where.status = status;

  const [audits, total] = await Promise.all([
    prisma.audit.findMany({
      where,
      include: {
        auditor: { select: { name: true } },
        results: { select: { result: true } },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.audit.count({ where }),
  ]);

  const data: AuditListItem[] = audits.map((a) => {
    const totalControls = a.results.length;
    const evaluatedCount = a.results.filter((r) => r.result !== 'not_evaluated').length;
    const compliantCount = a.results.filter((r) => r.result === 'compliant').length;

    return {
      id: a.id,
      companyId: a.companyId,
      auditorId: a.auditorId,
      auditorName: a.auditor.name,
      date: a.date.toISOString(),
      status: a.status as AuditListItem['status'],
      notes: a.notes,
      totalControls,
      evaluatedCount,
      compliantCount,
      createdAt: a.createdAt.toISOString(),
    };
  });

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAuditDetail(companyId: number, auditId: number): Promise<AuditDetailModel | null> {
  const audit = await prisma.audit.findFirst({
    where: { id: auditId, companyId },
    include: {
      auditor: { select: { name: true } },
      results: {
        include: {
          control: {
            include: { theme: { select: { id: true, name: true } } },
          },
        },
        orderBy: { control: { code: 'asc' } },
      },
    },
  });

  if (!audit) return null;

  const results: AuditResultItem[] = audit.results.map((r) => ({
    id: r.id,
    controlId: r.controlId,
    code: r.control.code,
    title: r.control.title,
    themeName: r.control.theme.name,
    themeId: r.control.theme.id,
    result: r.result as AuditResultItem['result'],
    comments: r.comments,
    evidence: r.evidence,
  }));

  const totalControls = results.length;
  const evaluatedCount = results.filter((r) => r.result !== 'not_evaluated').length;
  const compliantCount = results.filter((r) => r.result === 'compliant').length;

  return {
    id: audit.id,
    companyId: audit.companyId,
    auditorId: audit.auditorId,
    auditorName: audit.auditor.name,
    date: audit.date.toISOString(),
    status: audit.status as AuditListItem['status'],
    notes: audit.notes,
    totalControls,
    evaluatedCount,
    compliantCount,
    createdAt: audit.createdAt.toISOString(),
    results,
  };
}

export async function createAudit(
  companyId: number,
  auditorId: number,
  input: CreateAuditInput,
): Promise<AuditDetailModel> {
  // Get the applicable controls for this company (from SoA)
  const soaEntries = await prisma.statementOfApplicability.findMany({
    where: { companyId, applicable: true },
    select: { controlId: true },
  });

  if (soaEntries.length === 0) {
    throw new Error('NO_CONTROLS');
  }

  const audit = await prisma.audit.create({
    data: {
      companyId,
      auditorId,
      date: new Date(input.date),
      status: 'planned',
      notes: input.notes ?? null,
    },
  });

  // Batch create AuditResult for each applicable control
  await prisma.auditResult.createMany({
    data: soaEntries.map((entry) => ({
      auditId: audit.id,
      controlId: entry.controlId,
      result: 'not_evaluated',
    })),
  });

  // Return the full detail
  return (await getAuditDetail(companyId, audit.id))!;
}

export async function updateAudit(
  companyId: number,
  auditId: number,
  input: UpdateAuditInput,
) {
  const audit = await prisma.audit.findFirst({ where: { id: auditId, companyId } });
  if (!audit) return null;

  const updated = await prisma.audit.update({
    where: { id: auditId },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: { auditor: { select: { name: true } }, results: { select: { result: true } } },
  });

  const totalControls = updated.results.length;
  const evaluatedCount = updated.results.filter((r) => r.result !== 'not_evaluated').length;
  const compliantCount = updated.results.filter((r) => r.result === 'compliant').length;

  return {
    id: updated.id,
    companyId: updated.companyId,
    auditorId: updated.auditorId,
    auditorName: updated.auditor.name,
    date: updated.date.toISOString(),
    status: updated.status,
    notes: updated.notes,
    totalControls,
    evaluatedCount,
    compliantCount,
    createdAt: updated.createdAt.toISOString(),
  };
}

export async function deleteAudit(companyId: number, auditId: number): Promise<boolean> {
  const audit = await prisma.audit.findFirst({ where: { id: auditId, companyId } });
  if (!audit) return false;

  await prisma.audit.delete({ where: { id: auditId } });
  return true;
}

export async function updateAuditResult(
  auditId: number,
  controlId: number,
  input: UpdateAuditResultInput,
) {
  const existing = await prisma.auditResult.findUnique({
    where: { auditId_controlId: { auditId, controlId } },
  });
  if (!existing) return null;

  const updated = await prisma.auditResult.update({
    where: { auditId_controlId: { auditId, controlId } },
    data: {
      result: input.result,
      ...(input.comments !== undefined && { comments: input.comments }),
      ...(input.evidence !== undefined && { evidence: input.evidence }),
    },
    include: {
      control: { include: { theme: { select: { id: true, name: true } } } },
    },
  });

  // Check if all results are evaluated → auto-complete the audit
  const allResults = await prisma.auditResult.findMany({
    where: { auditId },
    select: { result: true },
  });
  const allEvaluated = allResults.every((r) => r.result !== 'not_evaluated');
  if (allEvaluated) {
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'completed' },
    });
  } else {
    // If at least one is evaluated, set to in_progress
    const anyEvaluated = allResults.some((r) => r.result !== 'not_evaluated');
    if (anyEvaluated) {
      const audit = await prisma.audit.findUnique({ where: { id: auditId }, select: { status: true } });
      if (audit?.status === 'planned') {
        await prisma.audit.update({
          where: { id: auditId },
          data: { status: 'in_progress' },
        });
      }
    }
  }

  return {
    id: updated.id,
    controlId: updated.controlId,
    code: updated.control.code,
    title: updated.control.title,
    themeName: updated.control.theme.name,
    themeId: updated.control.theme.id,
    result: updated.result,
    comments: updated.comments,
    evidence: updated.evidence,
  } as AuditResultItem;
}
