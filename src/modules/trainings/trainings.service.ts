import prisma from '../../config/database';

// ─── Admin: CRUD global trainings ───────────────────

interface TrainingsFilter {
  search?: string;
  trainingType?: string;
  page: number;
  limit: number;
}

export async function getTrainings(filter: TrainingsFilter) {
  const where: Record<string, unknown> = { isActive: true };
  if (filter.trainingType) where.trainingType = filter.trainingType;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.training.count({ where }),
    prisma.training.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { companyTrainings: true } },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      trainingType: t.trainingType,
      resourcesJson: t.resourcesJson,
      createdBy: t.createdBy,
      creatorName: t.creator.name,
      isActive: t.isActive,
      companiesCount: t._count.companyTrainings,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.ceil(total / filter.limit),
    },
  };
}

export async function getTrainingById(id: number) {
  const t = await prisma.training.findFirst({
    where: { id, isActive: true },
    include: {
      creator: { select: { id: true, name: true } },
      companyTrainings: {
        include: {
          company: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  });
  if (!t) return null;

  return {
    id: t.id,
    title: t.title,
    description: t.description,
    trainingType: t.trainingType,
    resourcesJson: t.resourcesJson,
    createdBy: t.createdBy,
    creatorName: t.creator.name,
    isActive: t.isActive,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    companyTrainings: t.companyTrainings.map((ct) => ({
      id: ct.id,
      companyId: ct.companyId,
      companyName: ct.company.name,
      assignedAt: ct.assignedAt,
      enrollmentsCount: ct._count.enrollments,
    })),
  };
}

interface CreateTrainingInput {
  title: string;
  description?: string;
  trainingType: 'ORGANIZATIONAL' | 'PEOPLE' | 'PHYSICAL' | 'TECHNOLOGICAL' | 'PROCESS';
  resourcesJson?: unknown[];
}

export async function createTraining(userId: number, input: CreateTrainingInput) {
  return prisma.training.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      trainingType: input.trainingType,
      resourcesJson: (input.resourcesJson as unknown) ?? [],
      createdBy: userId,
    },
  });
}

export async function updateTraining(id: number, input: Partial<CreateTrainingInput>) {
  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.trainingType !== undefined) data.trainingType = input.trainingType;
  if (input.resourcesJson !== undefined) data.resourcesJson = input.resourcesJson as unknown;

  return prisma.training.update({ where: { id }, data });
}

export async function deleteTraining(id: number) {
  return prisma.training.update({ where: { id }, data: { isActive: false } });
}

// ─── Company-scoped: assign & enroll ────────────────

export async function getCompanyTrainings(companyId: number) {
  const items = await prisma.companyTraining.findMany({
    where: { companyId },
    include: {
      training: {
        select: {
          id: true,
          title: true,
          description: true,
          trainingType: true,
          resourcesJson: true,
          createdAt: true,
        },
      },
      enrollments: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      assignedByUser: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return items.map((ct) => ({
    id: ct.id,
    trainingId: ct.training.id,
    companyId: ct.companyId,
    title: ct.training.title,
    description: ct.training.description,
    trainingType: ct.training.trainingType,
    resourcesJson: ct.training.resourcesJson,
    trainingCreatedAt: ct.training.createdAt,
    assignedAt: ct.assignedAt,
    assignedByName: ct.assignedByUser.name,
    enrollments: ct.enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.user.name,
      userEmail: e.user.email,
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      notes: e.notes,
    })),
  }));
}

export async function getCompanyTrainingDetail(companyId: number, trainingId: number) {
  const ct = await prisma.companyTraining.findFirst({
    where: { companyId, trainingId },
    include: {
      training: true,
      enrollments: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      assignedByUser: { select: { id: true, name: true } },
    },
  });
  if (!ct) return null;

  return {
    id: ct.id,
    trainingId: ct.training.id,
    companyId: ct.companyId,
    title: ct.training.title,
    description: ct.training.description,
    trainingType: ct.training.trainingType,
    resourcesJson: ct.training.resourcesJson,
    isActive: ct.training.isActive,
    createdAt: ct.training.createdAt,
    assignedAt: ct.assignedAt,
    assignedByName: ct.assignedByUser.name,
    enrollments: ct.enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.user.name,
      userEmail: e.user.email,
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      notes: e.notes,
    })),
  };
}

export async function assignTrainingToCompany(trainingId: number, companyId: number, assignedBy: number) {
  return prisma.companyTraining.create({
    data: { trainingId, companyId, assignedBy },
  });
}

export async function removeTrainingFromCompany(companyId: number, trainingId: number) {
  return prisma.companyTraining.delete({
    where: { trainingId_companyId: { trainingId, companyId } },
  });
}

export async function enrollUser(companyTrainingId: number, userId: number) {
  return prisma.trainingUserEnrollment.create({
    data: { companyTrainingId, userId },
  });
}

export async function updateEnrollmentStatus(enrollmentId: number, status: string) {
  const data: Record<string, unknown> = { status };
  if (status === 'COMPLETED') {
    data.completedAt = new Date();
  }
  return prisma.trainingUserEnrollment.update({
    where: { id: enrollmentId },
    data,
  });
}

export async function getAvailableTrainingsForCompany(companyId: number) {
  const assigned = await prisma.companyTraining.findMany({
    where: { companyId },
    select: { trainingId: true },
  });
  const assignedIds = assigned.map((ct) => ct.trainingId);

  return prisma.training.findMany({
    where: {
      isActive: true,
      id: { notIn: assignedIds.length > 0 ? assignedIds : undefined },
    },
    select: {
      id: true,
      title: true,
      trainingType: true,
      description: true,
      createdAt: true,
    },
    orderBy: { title: 'asc' },
  });
}
