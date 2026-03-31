import type { Request, Response } from 'express';
import * as companiesService from './companies.service';

export async function listCompanies(_req: Request, res: Response) {
  const data = await companiesService.getAllCompanies();
  res.json({ data });
}

export async function getCompany(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await companiesService.getCompanyById(id);
  if (!data) {
    res.status(404).json({ error: 'Empresa no encontrada' });
    return;
  }
  res.json({ data });
}

export async function createCompany(req: Request, res: Response) {
  const { name, sectorId, sizeId, country } = req.body;
  const data = await companiesService.createCompany({ name, sectorId, sizeId, country }, req.user!.id);
  res.status(201).json({ data });
}

export async function updateCompany(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await companiesService.updateCompany(id, req.body);
  res.json({ data });
}

export async function deleteCompany(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  await companiesService.deleteCompany(id);
  res.status(204).end();
}

export async function listCompanyUsers(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await companiesService.getCompanyUsers(companyId);
  res.json({ data });
}

export async function addCompanyUser(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const { userId, roleInCompany } = req.body;
  const data = await companiesService.addCompanyUser(companyId, userId, roleInCompany);
  res.status(201).json({ data });
}

export async function removeCompanyUser(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const userId = parseInt(String(req.params.userId));
  await companiesService.removeCompanyUser(companyId, userId);
  res.status(204).end();
}
