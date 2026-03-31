import prisma from '../../config/database';
import type {
  IsoThemeModel,
  IsoControlModel,
  CompanyControlModel,
  SoAEntryModel,
  UpdateCompanyControlInput,
  AssignControlInput,
  UpdateSoAInput,
  PaginatedResult,
} from '../../models';

// ── ISO Themes ──────────────────────────────────────

export async function getThemes(): Promise<IsoThemeModel[]> {
  const themes = await prisma.isoTheme.findMany({
    include: { _count: { select: { controls: true } } },
    orderBy: { id: 'asc' },
  });

  return themes.map((t): IsoThemeModel => ({
    id: t.id,
    name: t.name,
    description: t.description,
    controlsCount: t._count.controls,
  }));
}

// ── ISO Controls Catalog ─────────────────────────────

export interface CatalogFilter {
  themeId?: number;
  controlType?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getCatalogControls(filter: CatalogFilter): Promise<PaginatedResult<IsoControlModel>> {
  const where: Record<string, unknown> = {};
  if (filter.themeId) where.themeId = filter.themeId;
  if (filter.controlType) where.controlType = filter.controlType;
  if (filter.search) {
    where.OR = [
      { code: { contains: filter.search, mode: 'insensitive' } },
      { title: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.isoControl.count({ where }),
    prisma.isoControl.findMany({
      where,
      include: { theme: { select: { name: true } } },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { code: 'asc' },
    }),
  ]);

  return {
    data: items.map((c): IsoControlModel => ({
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      themeId: c.themeId,
      themeName: c.theme.name,
      controlType: c.controlType,
      properties: c.properties,
      version: c.version,
    })),
    meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) },
  };
}

export async function getCatalogControlById(id: number): Promise<IsoControlModel | null> {
  const c = await prisma.isoControl.findUnique({
    where: { id },
    include: { theme: { select: { name: true } } },
  });
  if (!c) return null;

  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    themeId: c.themeId,
    themeName: c.theme.name,
    controlType: c.controlType,
    properties: c.properties,
    version: c.version,
  };
}

export async function updateCatalogControl(
  id: number,
  data: Pick<Partial<IsoControlModel>, 'title' | 'description' | 'controlType' | 'properties'>,
): Promise<IsoControlModel | null> {
  const c = await prisma.isoControl.update({
    where: { id },
    data,
    include: { theme: { select: { name: true } } },
  });

  return {
    id: c.id,
    code: c.code,
    title: c.title,
    description: c.description,
    themeId: c.themeId,
    themeName: c.theme.name,
    controlType: c.controlType,
    properties: c.properties,
    version: c.version,
  };
}

// ── Company Controls (assignments) ───────────────────

export interface CompanyControlsFilter {
  companyId: number;
  themeId?: number;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export async function getCompanyControls(filter: CompanyControlsFilter): Promise<PaginatedResult<CompanyControlModel>> {
  const where: Record<string, unknown> = { companyId: filter.companyId };
  if (filter.status) where.status = filter.status;

  const controlWhere: Record<string, unknown> = {};
  if (filter.themeId) controlWhere.themeId = filter.themeId;
  if (filter.search) controlWhere.title = { contains: filter.search, mode: 'insensitive' };
  if (Object.keys(controlWhere).length > 0) where.control = controlWhere;

  const [total, items] = await Promise.all([
    prisma.companyControl.count({ where }),
    prisma.companyControl.findMany({
      where,
      include: {
        control: { include: { theme: { select: { name: true } } } },
        assignedUser: { select: { name: true } },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { control: { code: 'asc' } },
    }),
  ]);

  return {
    data: items.map((cc): CompanyControlModel => ({
      id: cc.id,
      companyId: cc.companyId,
      controlId: cc.controlId,
      code: cc.control.code,
      title: cc.control.title,
      themeName: cc.control.theme.name,
      status: cc.status,
      maturityLevel: cc.maturityLevel,
      compliancePercentage: cc.compliancePercentage,
      assignedUserName: cc.assignedUser?.name ?? null,
      assignedUserId: cc.assignedUserId,
      implementationDate: cc.implementationDate,
      reviewDate: cc.reviewDate,
      notes: cc.notes,
      createdAt: cc.createdAt,
      updatedAt: cc.updatedAt,
    })),
    meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) },
  };
}

export async function assignControlToCompany(companyId: number, input: AssignControlInput): Promise<CompanyControlModel> {
  const cc = await prisma.companyControl.create({
    data: {
      companyId,
      controlId: input.controlId,
      status: input.status ?? 'pending',
      maturityLevel: input.maturityLevel ?? 'initial',
      assignedUserId: input.assignedUser ?? null,
      notes: input.notes ?? null,
    },
    include: {
      control: { include: { theme: { select: { name: true } } } },
      assignedUser: { select: { name: true } },
    },
  });

  return {
    id: cc.id,
    companyId: cc.companyId,
    controlId: cc.controlId,
    code: cc.control.code,
    title: cc.control.title,
    themeName: cc.control.theme.name,
    status: cc.status,
    maturityLevel: cc.maturityLevel,
    compliancePercentage: cc.compliancePercentage,
    assignedUserId: cc.assignedUserId,
    assignedUserName: cc.assignedUser?.name ?? null,
    implementationDate: cc.implementationDate,
    reviewDate: cc.reviewDate,
    notes: cc.notes,
    createdAt: cc.createdAt,
    updatedAt: cc.updatedAt,
  };
}

export async function updateCompanyControl(
  companyId: number,
  controlId: number,
  input: UpdateCompanyControlInput,
): Promise<CompanyControlModel> {
  const updateData: Record<string, unknown> = {};
  if (input.status !== undefined) updateData.status = input.status;
  if (input.maturityLevel !== undefined) updateData.maturityLevel = input.maturityLevel;
  if (input.compliancePercentage !== undefined) updateData.compliancePercentage = input.compliancePercentage;
  if (input.assignedUser !== undefined) updateData.assignedUserId = input.assignedUser;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.reviewDate !== undefined) updateData.reviewDate = new Date(input.reviewDate);

  const cc = await prisma.companyControl.update({
    where: { companyId_controlId: { companyId, controlId } },
    data: updateData,
    include: {
      control: { include: { theme: { select: { name: true } } } },
      assignedUser: { select: { name: true } },
    },
  });

  return {
    id: cc.id,
    companyId: cc.companyId,
    controlId: cc.controlId,
    code: cc.control.code,
    title: cc.control.title,
    themeName: cc.control.theme.name,
    status: cc.status,
    maturityLevel: cc.maturityLevel,
    compliancePercentage: cc.compliancePercentage,
    assignedUserName: cc.assignedUser?.name ?? null,
    assignedUserId: cc.assignedUserId,
    implementationDate: cc.implementationDate,
    reviewDate: cc.reviewDate,
    notes: cc.notes,
    createdAt: cc.createdAt,
    updatedAt: cc.updatedAt,
  };
}

export async function removeCompanyControl(companyId: number, controlId: number): Promise<void> {
  await prisma.companyControl.delete({
    where: { companyId_controlId: { companyId, controlId } },
  });
}

// ── Statement of Applicability ────────────────────────

export async function getSoA(companyId: number): Promise<SoAEntryModel[]> {
  const entries = await prisma.statementOfApplicability.findMany({
    where: { companyId },
    include: {
      control: { include: { theme: { select: { name: true } } } },
    },
    orderBy: { control: { code: 'asc' } },
  });

  return entries.map((e): SoAEntryModel => ({
    controlId: e.controlId,
    code: e.control.code,
    title: e.control.title,
    themeName: e.control.theme.name,
    applicable: e.applicable,
    justification: e.justification,
    implementationStatus: e.implementationStatus,
  }));
}

export async function updateSoA(companyId: number, controlId: number, input: UpdateSoAInput): Promise<void> {
  await prisma.statementOfApplicability.upsert({
    where: { companyId_controlId: { companyId, controlId } },
    update: input,
    create: { companyId, controlId, ...input },
  });
}
