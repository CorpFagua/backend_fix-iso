import type { Request, Response } from 'express';
import * as controlsService from './controls.service';

export async function listThemes(_req: Request, res: Response) {
  const data = await controlsService.getThemes();
  res.json({ data });
}

// ── ISO Catalog ──

export async function listCatalogControls(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const themeId = req.query.themeId ? parseInt(req.query.themeId as string) : undefined;
  const controlType = req.query.controlType as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await controlsService.getCatalogControls({ page, limit, themeId, controlType, search });
  res.json(result);
}

export async function getCatalogControl(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await controlsService.getCatalogControlById(id);
  if (!data) {
    res.status(404).json({ error: 'Control no encontrado' });
    return;
  }
  res.json({ data });
}

export async function updateCatalogControlHandler(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await controlsService.updateCatalogControl(id, req.body);
  res.json({ data });
}

// ── Company Control Assignments ──

export async function assignControl(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await controlsService.assignControlToCompany(companyId, req.body);
  res.status(201).json({ data });
}

export async function removeControl(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));
  await controlsService.removeCompanyControl(companyId, controlId);
  res.status(204).end();
}

export async function listCompanyControls(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const themeId = req.query.themeId ? parseInt(req.query.themeId as string) : undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await controlsService.getCompanyControls({ companyId, themeId, status, search, page, limit });
  res.json(result);
}

export async function updateCompanyControl(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));
  const data = await controlsService.updateCompanyControl(companyId, controlId, req.body);
  res.json({ data });
}

export async function listSoA(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await controlsService.getSoA(companyId);
  res.json({ data });
}

export async function updateSoA(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));
  await controlsService.updateSoA(companyId, controlId, req.body);
  res.json({ success: true });
}

// ── Auto-generation of Controls ──

export async function generateControls(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  try {
    const result = await controlsService.generateCompanyControls(companyId);
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already has generated controls')) {
      res.status(409).json({ error: error.message });
    } else {
      throw error;
    }
  }
}

export async function regenerateControls(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const confirm = req.body.confirm === true;

  if (!confirm) {
    res.status(400).json({ error: 'Regeneration requires confirmation (confirm=true in body)' });
    return;
  }

  const result = await controlsService.regenerateCompanyControls(companyId, confirm);
  res.status(200).json({ data: result });
}

// ── Control Applicability Rules (admin CRUD) ──

export async function listApplicabilityRules(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const sectorId = req.query.sectorId ? parseInt(req.query.sectorId as string) : undefined;
  const sizeId = req.query.sizeId ? parseInt(req.query.sizeId as string) : undefined;
  const search = req.query.search as string | undefined;

  const result = await controlsService.listApplicabilityRules({ page, limit, sectorId, sizeId, search });
  res.json(result);
}

export async function updateApplicabilityRule(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const { priority, mandatory } = req.body as { priority?: number; mandatory?: boolean };
  const data = await controlsService.updateApplicabilityRule(id, { priority, mandatory });
  res.json({ data });
}

export async function deleteApplicabilityRule(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  await controlsService.deleteApplicabilityRule(id);
  res.status(204).end();
}
