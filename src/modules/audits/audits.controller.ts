import type { Request, Response } from 'express';
import * as auditsService from './audits.service';

export async function listAudits(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string | undefined;

  const result = await auditsService.listAudits({ companyId, status, page, limit });
  res.json(result);
}

export async function getAudit(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const auditId = parseInt(String(req.params.auditId));

  const data = await auditsService.getAuditDetail(companyId, auditId);
  if (!data) {
    res.status(404).json({ error: 'Auditoría no encontrada' });
    return;
  }
  res.json({ data });
}

export async function createAudit(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const auditorId = req.user!.id;

  try {
    const data = await auditsService.createAudit(companyId, auditorId, req.body);
    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_CONTROLS') {
      res.status(400).json({
        error: 'Primero debe generar los controles ISO para esta empresa antes de crear una auditoría.',
      });
      return;
    }
    throw error;
  }
}

export async function updateAudit(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const auditId = parseInt(String(req.params.auditId));

  const data = await auditsService.updateAudit(companyId, auditId, req.body);
  if (!data) {
    res.status(404).json({ error: 'Auditoría no encontrada' });
    return;
  }
  res.json({ data });
}

export async function deleteAudit(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const auditId = parseInt(String(req.params.auditId));

  const deleted = await auditsService.deleteAudit(companyId, auditId);
  if (!deleted) {
    res.status(404).json({ error: 'Auditoría no encontrada' });
    return;
  }
  res.status(204).end();
}

export async function updateResult(req: Request, res: Response) {
  const auditId = parseInt(String(req.params.auditId));
  const controlId = parseInt(String(req.params.controlId));

  const data = await auditsService.updateAuditResult(auditId, controlId, req.body);
  if (!data) {
    res.status(404).json({ error: 'Resultado de auditoría no encontrado' });
    return;
  }
  res.json({ data });
}
