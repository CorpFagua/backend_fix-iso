import prisma from '../../config/database';

// ── Constantes de dimensiones ISO 27001 ─────────────────────────────────────

export const IMPLEMENTATION_DIMENSIONS = [
  { key: 'policy', label: 'Política', description: 'Existe una política organizacional que cubre este control o área de seguridad' },
  { key: 'procedures', label: 'Procedimientos', description: 'Procedimientos documentados que definen cómo ejecutar el control paso a paso' },
  { key: 'technical', label: 'Implementación técnica', description: 'Medidas técnicas o controles operativos activamente desplegados' },
  { key: 'evidence', label: 'Evidencia y registros', description: 'Registros y documentación que demuestran que el control está operando' },
  { key: 'training', label: 'Capacitación', description: 'Personal involucrado ha sido capacitado sobre este control' },
  { key: 'monitoring', label: 'Monitoreo y revisión', description: 'Mecanismos de seguimiento continuo y revisión periódica del control' },
] as const;

export type ImplementationDimension = typeof IMPLEMENTATION_DIMENSIONS[number]['key'];
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface ImplementationTaskModel {
  id: number;
  dimension: ImplementationDimension;
  dimensionLabel: string;
  dimensionDescription: string;
  status: TaskStatus;
  notes: string | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface ImplementationNoteModel {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface ImplementationControlSummary {
  companyControlId: number;
  controlId: number;
  code: string;
  title: string;
  themeName: string;
  status: string;
  maturityLevel: string;
  assignedUserName: string | null;
  progressPercentage: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface ImplementationControlDetail extends ImplementationControlSummary {
  description: string;
  tasks: ImplementationTaskModel[];
  notes: ImplementationNoteModel[];
}

export interface ImplementationDomainSummary {
  themeId: number;
  themeName: string;
  totalControls: number;
  progressPercentage: number;
}

export interface ImplementationGlobalSummary {
  totalControls: number;
  progressPercentage: number;
  byDomain: ImplementationDomainSummary[];
  byDimension: Array<{ dimension: ImplementationDimension; label: string; completedCount: number; totalCount: number }>;
}

// ── Helper: ensure tasks exist (lazy creation) ───────────────────────────────

async function ensureTasksExist(companyControlId: number): Promise<void> {
  const existing = await prisma.implementationTask.count({ where: { companyControlId } });
  if (existing === IMPLEMENTATION_DIMENSIONS.length) return;

  const existingDimensions = await prisma.implementationTask.findMany({
    where: { companyControlId },
    select: { dimension: true },
  });
  const existingKeys = new Set(existingDimensions.map(t => t.dimension));

  const missing = IMPLEMENTATION_DIMENSIONS.filter(d => !existingKeys.has(d.key));
  if (missing.length > 0) {
    await prisma.implementationTask.createMany({
      data: missing.map(d => ({ companyControlId, dimension: d.key, status: 'not_started' })),
    });
  }
}

function calcProgress(tasks: { status: string }[]): number {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
}

function mapTaskToModel(t: { id: number; dimension: string; status: string; notes: string | null; completedAt: Date | null; updatedAt: Date }): ImplementationTaskModel {
  const dimMeta = IMPLEMENTATION_DIMENSIONS.find(d => d.key === t.dimension);
  return {
    id: t.id,
    dimension: t.dimension as ImplementationDimension,
    dimensionLabel: dimMeta?.label ?? t.dimension,
    dimensionDescription: dimMeta?.description ?? '',
    status: t.status as TaskStatus,
    notes: t.notes,
    completedAt: t.completedAt,
    updatedAt: t.updatedAt,
  };
}

// ── Service functions ─────────────────────────────────────────────────────────

export interface ListFilter {
  companyId: number;
  themeId?: number;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function listImplementationControls(filter: ListFilter): Promise<{
  data: ImplementationControlSummary[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where: Record<string, unknown> = { companyId: filter.companyId };
  if (filter.status) where.status = filter.status;

  const controlWhere: Record<string, unknown> = {};
  if (filter.themeId) controlWhere.themeId = filter.themeId;
  if (filter.search) {
    controlWhere.OR = [
      { code: { contains: filter.search, mode: 'insensitive' } },
      { title: { contains: filter.search, mode: 'insensitive' } },
    ];
  }
  if (Object.keys(controlWhere).length > 0) where.control = controlWhere;

  const [total, items] = await Promise.all([
    prisma.companyControl.count({ where }),
    prisma.companyControl.findMany({
      where,
      include: {
        control: { include: { theme: { select: { name: true } } } },
        assignedUser: { select: { name: true } },
        implementationTasks: { select: { status: true } },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { control: { code: 'asc' } },
    }),
  ]);

  const data: ImplementationControlSummary[] = items.map(cc => {
    const tasks = cc.implementationTasks;
    const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = IMPLEMENTATION_DIMENSIONS.length;
    const progressPercentage = tasks.length > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      companyControlId: cc.id,
      controlId: cc.controlId,
      code: cc.control.code,
      title: cc.control.title,
      themeName: cc.control.theme.name,
      status: cc.status,
      maturityLevel: cc.maturityLevel,
      assignedUserName: cc.assignedUser?.name ?? null,
      progressPercentage,
      tasksCompleted,
      totalTasks,
    };
  });

  return { data, meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) } };
}

export async function getImplementationDetail(companyId: number, controlId: number): Promise<ImplementationControlDetail | null> {
  const cc = await prisma.companyControl.findUnique({
    where: { companyId_controlId: { companyId, controlId } },
    include: {
      control: { include: { theme: { select: { name: true } } } },
      assignedUser: { select: { name: true } },
      implementationTasks: { orderBy: { id: 'asc' } },
      implementationNotes: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!cc) return null;

  // Lazy creation of tasks if not yet created
  await ensureTasksExist(cc.id);

  // Re-fetch tasks after potential creation
  const tasks = await prisma.implementationTask.findMany({
    where: { companyControlId: cc.id },
    orderBy: { id: 'asc' },
  });

  const progressPercentage = calcProgress(tasks);

  return {
    companyControlId: cc.id,
    controlId: cc.controlId,
    code: cc.control.code,
    title: cc.control.title,
    description: cc.control.description,
    themeName: cc.control.theme.name,
    status: cc.status,
    maturityLevel: cc.maturityLevel,
    assignedUserName: cc.assignedUser?.name ?? null,
    progressPercentage,
    tasksCompleted: tasks.filter(t => t.status === 'completed').length,
    totalTasks: IMPLEMENTATION_DIMENSIONS.length,
    tasks: tasks.map(mapTaskToModel),
    notes: cc.implementationNotes.map(n => ({
      id: n.id,
      userId: n.userId,
      userName: n.user.name,
      content: n.content,
      createdAt: n.createdAt,
    })),
  };
}

export async function updateImplementationTask(
  companyId: number,
  controlId: number,
  taskId: number,
  input: { status?: TaskStatus; notes?: string },
): Promise<ImplementationTaskModel> {
  // Verify the task belongs to this company/control
  const task = await prisma.implementationTask.findFirst({
    where: {
      id: taskId,
      companyControl: { companyId, controlId },
    },
  });

  if (!task) throw new Error('Task not found');

  const updateData: Record<string, unknown> = {};
  if (input.status !== undefined) {
    updateData.status = input.status;
    updateData.completedAt = input.status === 'completed' ? new Date() : null;
  }
  if (input.notes !== undefined) updateData.notes = input.notes;

  const updated = await prisma.implementationTask.update({
    where: { id: taskId },
    data: updateData,
  });

  // Update companyControl compliancePercentage to stay in sync
  const allTasks = await prisma.implementationTask.findMany({
    where: { companyControlId: task.companyControlId },
    select: { status: true },
  });
  const newPercentage = calcProgress(allTasks);

  // Determine status from progress
  let newStatus = 'pending';
  if (newPercentage === 100) newStatus = 'implemented';
  else if (newPercentage > 0) newStatus = 'in_progress';

  await prisma.companyControl.update({
    where: { id: task.companyControlId },
    data: { compliancePercentage: newPercentage, status: newStatus },
  });

  return mapTaskToModel(updated);
}

export async function addImplementationNote(
  companyId: number,
  controlId: number,
  userId: number,
  content: string,
): Promise<ImplementationNoteModel> {
  const cc = await prisma.companyControl.findUnique({
    where: { companyId_controlId: { companyId, controlId } },
    select: { id: true },
  });

  if (!cc) throw new Error('CompanyControl not found');

  const note = await prisma.implementationNote.create({
    data: { companyControlId: cc.id, userId, content },
    include: { user: { select: { name: true } } },
  });

  return { id: note.id, userId: note.userId, userName: note.user.name, content: note.content, createdAt: note.createdAt };
}

export async function getImplementationSummary(companyId: number): Promise<ImplementationGlobalSummary> {
  const companyControls = await prisma.companyControl.findMany({
    where: { companyId },
    include: {
      control: { include: { theme: { select: { id: true, name: true } } } },
      implementationTasks: { select: { dimension: true, status: true } },
    },
  });

  if (companyControls.length === 0) {
    return {
      totalControls: 0,
      progressPercentage: 0,
      byDomain: [],
      byDimension: IMPLEMENTATION_DIMENSIONS.map(d => ({ dimension: d.key, label: d.label, completedCount: 0, totalCount: 0 })),
    };
  }

  // Global progress
  let totalTaskSlots = 0;
  let totalCompleted = 0;

  // By domain
  const domainMap = new Map<number, { themeName: string; totalSlots: number; completed: number; controlCount: number }>();

  // By dimension
  const dimMap = new Map<string, { completedCount: number; totalCount: number }>();
  for (const d of IMPLEMENTATION_DIMENSIONS) {
    dimMap.set(d.key, { completedCount: 0, totalCount: 0 });
  }

  for (const cc of companyControls) {
    const themeId = cc.control.themeId;
    const themeName = cc.control.theme.name;

    if (!domainMap.has(themeId)) {
      domainMap.set(themeId, { themeName, totalSlots: 0, completed: 0, controlCount: 0 });
    }
    const domain = domainMap.get(themeId)!;
    domain.controlCount++;

    const tasks = cc.implementationTasks;
    // If tasks not yet created, count as 0/6
    const tasksToCount = tasks.length === IMPLEMENTATION_DIMENSIONS.length ? tasks : [];

    for (const task of tasksToCount) {
      totalTaskSlots++;
      domain.totalSlots++;
      const dim = dimMap.get(task.dimension);
      if (dim) dim.totalCount++;

      if (task.status === 'completed') {
        totalCompleted++;
        domain.completed++;
        const dim = dimMap.get(task.dimension);
        if (dim) dim.completedCount++;
      }
    }

    // If not counted (no tasks yet), add 6 slots as 0
    if (tasksToCount.length === 0) {
      totalTaskSlots += IMPLEMENTATION_DIMENSIONS.length;
      domain.totalSlots += IMPLEMENTATION_DIMENSIONS.length;
      for (const d of IMPLEMENTATION_DIMENSIONS) {
        const dim = dimMap.get(d.key)!;
        dim.totalCount++;
      }
    }
  }

  const progressPercentage = totalTaskSlots > 0 ? Math.round((totalCompleted / totalTaskSlots) * 100) : 0;

  const byDomain: ImplementationDomainSummary[] = Array.from(domainMap.entries()).map(([themeId, v]) => ({
    themeId,
    themeName: v.themeName,
    totalControls: v.controlCount,
    progressPercentage: v.totalSlots > 0 ? Math.round((v.completed / v.totalSlots) * 100) : 0,
  })).sort((a, b) => a.themeName.localeCompare(b.themeName));

  const byDimension = IMPLEMENTATION_DIMENSIONS.map(d => {
    const v = dimMap.get(d.key)!;
    return { dimension: d.key, label: d.label, completedCount: v.completedCount, totalCount: v.totalCount };
  });

  return { totalControls: companyControls.length, progressPercentage, byDomain, byDimension };
}
