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

// ── Auto-generation of Controls ─────────────────────────────

export interface GenerateControlsResult {
  total: number;
  applicable: number;
  mandatory: number;
  recommended: number;
}

/**
 * Generate control applicability and company controls for a company based on sector + size
 * Creates StatementOfApplicability entries for all 93 controls (applicable=true/false)
 * Creates CompanyControl entries only for applicable controls (status=pending, maturity=initial)
 */
export async function generateCompanyControls(companyId: number): Promise<GenerateControlsResult> {
  // Get company to fetch sector and size
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { sector: { select: { name: true } }, size: { select: { name: true } } },
  });

  if (!company) {
    throw new Error(`Company with id ${companyId} not found`);
  }

  // Check if company already has controls generated (SoA entries exist)
  const existingSoA = await prisma.statementOfApplicability.count({
    where: { companyId },
  });

  if (existingSoA > 0) {
    throw new Error(`Company ${companyId} already has generated controls. Use regenerate to replace them.`);
  }

  // Get all ISO controls
  const allControls = await prisma.isoControl.findMany({
    orderBy: { id: 'asc' },
  });

  // Get applicability rules for this sector + size combination
  const applicabilityRules = await prisma.controlApplicability.findMany({
    where: {
      sectorId: company.sectorId,
      sizeId: company.sizeId,
    },
  });

  // Create a map for quick lookup: controlId => rule
  const rulesMap = new Map(applicabilityRules.map((r) => [r.controlId, r]));

  // Prepare SoA and CompanyControl data
  const soaData: Array<{
    companyId: number;
    controlId: number;
    applicable: boolean;
    justification: string;
    implementationStatus: string;
  }> = [];

  const companyControlData: Array<{
    companyId: number;
    controlId: number;
    status: string;
    maturityLevel: string;
    compliancePercentage: number;
  }> = [];

  let applicable = 0;
  let mandatory = 0;

  for (const control of allControls) {
    const rule = rulesMap.get(control.id);

    if (rule) {
      // Control is applicable
      applicable++;
      if (rule.mandatory) mandatory++;

      // Create justification text
      const priorityLabel = rule.priority === 1 ? 'Alta' : rule.priority === 2 ? 'Media' : 'Baja';
      const mandatoryLabel = rule.mandatory ? 'Obligatorio' : 'Recomendado';
      const justification = `Aplicable según perfil: sector ${company.sector.name}, tamaño ${company.size.name}. Prioridad: ${priorityLabel}. ${mandatoryLabel}.`;

      soaData.push({
        companyId,
        controlId: control.id,
        applicable: true,
        justification,
        implementationStatus: 'pending',
      });

      companyControlData.push({
        companyId,
        controlId: control.id,
        status: 'pending',
        maturityLevel: 'initial',
        compliancePercentage: 0,
      });
    } else {
      // Control is not applicable for this sector/size
      soaData.push({
        companyId,
        controlId: control.id,
        applicable: false,
        justification: `No requerido según perfil de empresa (sector ${company.sector.name}, tamaño ${company.size.name}). Puede habilitarse manualmente si es necesario.`,
        implementationStatus: 'not_applicable',
      });
    }
  }

  // Batch create SoA entries
  await prisma.statementOfApplicability.createMany({
    data: soaData,
  });

  // Batch create CompanyControl entries (only applicable ones)
  if (companyControlData.length > 0) {
    await prisma.companyControl.createMany({
      data: companyControlData,
    });
  }

  return {
    total: allControls.length,
    applicable,
    mandatory,
    recommended: applicable - mandatory,
  };
}

/**
 * Regenerate control applicability for a company (delete existing, then generate new)
 * Requires confirmation flag to prevent accidental deletion
 */
export async function regenerateCompanyControls(companyId: number, confirm = false): Promise<GenerateControlsResult> {
  if (!confirm) {
    throw new Error('Regeneration requires confirmation (confirm=true)');
  }

  // Delete existing SoA and CompanyControl entries
  await prisma.statementOfApplicability.deleteMany({
    where: { companyId },
  });

  await prisma.companyControl.deleteMany({
    where: { companyId },
  });

  // Generate new controls
  return generateCompanyControls(companyId);
}

// ── Control Applicability Rules (admin CRUD) ─────────────────────────────

export interface ApplicabilityRuleItem {
  id: number;
  controlId: number;
  controlCode: string;
  controlTitle: string;
  sectorId: number;
  sectorName: string;
  sizeId: number;
  sizeName: string;
  priority: number;
  mandatory: boolean;
}

export interface ApplicabilityFilter {
  sectorId?: number;
  sizeId?: number;
  search?: string;
  page: number;
  limit: number;
}

export async function listApplicabilityRules(filter: ApplicabilityFilter): Promise<PaginatedResult<ApplicabilityRuleItem>> {
  const where: Record<string, unknown> = {};
  if (filter.sectorId) where.sectorId = filter.sectorId;
  if (filter.sizeId) where.sizeId = filter.sizeId;
  if (filter.search) {
    where.control = {
      OR: [
        { code: { contains: filter.search, mode: 'insensitive' } },
        { title: { contains: filter.search, mode: 'insensitive' } },
      ],
    };
  }

  const [total, items] = await Promise.all([
    prisma.controlApplicability.count({ where }),
    prisma.controlApplicability.findMany({
      where,
      include: {
        control: { select: { code: true, title: true } },
        sector: { select: { name: true } },
        size: { select: { name: true } },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: [{ sectorId: 'asc' }, { sizeId: 'asc' }, { control: { code: 'asc' } }],
    }),
  ]);

  return {
    data: items.map((r): ApplicabilityRuleItem => ({
      id: r.id,
      controlId: r.controlId,
      controlCode: r.control.code,
      controlTitle: r.control.title,
      sectorId: r.sectorId,
      sectorName: r.sector.name,
      sizeId: r.sizeId,
      sizeName: r.size.name,
      priority: r.priority,
      mandatory: r.mandatory,
    })),
    meta: { page: filter.page, limit: filter.limit, total, totalPages: Math.ceil(total / filter.limit) },
  };
}

export async function updateApplicabilityRule(
  id: number,
  data: { priority?: number; mandatory?: boolean },
): Promise<ApplicabilityRuleItem> {
  const r = await prisma.controlApplicability.update({
    where: { id },
    data,
    include: {
      control: { select: { code: true, title: true } },
      sector: { select: { name: true } },
      size: { select: { name: true } },
    },
  });

  return {
    id: r.id,
    controlId: r.controlId,
    controlCode: r.control.code,
    controlTitle: r.control.title,
    sectorId: r.sectorId,
    sectorName: r.sector.name,
    sizeId: r.sizeId,
    sizeName: r.size.name,
    priority: r.priority,
    mandatory: r.mandatory,
  };
}

export async function deleteApplicabilityRule(id: number): Promise<void> {
  await prisma.controlApplicability.delete({ where: { id } });
}
