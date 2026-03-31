import type { Request, Response } from 'express';
import * as assetsService from './assets.service';

export async function listAssets(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const assetType = req.query.assetType as string | undefined;
  const classification = req.query.classification as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await assetsService.getAssets({ companyId, assetType, classification, search, page, limit });
  res.json(result);
}

export async function getAsset(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const id = parseInt(String(req.params.id));
  const data = await assetsService.getAssetById(companyId, id);
  if (!data) {
    res.status(404).json({ error: 'Activo no encontrado' });
    return;
  }
  res.json({ data });
}

export async function createAsset(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await assetsService.createAsset(companyId, req.body);
  res.status(201).json({ data });
}

export async function updateAsset(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const id = parseInt(String(req.params.id));
  const data = await assetsService.updateAsset(companyId, id, req.body);
  res.json({ data });
}

export async function deleteAsset(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  await assetsService.deleteAsset(id);
  res.status(204).end();
}

export async function createRisk(req: Request, res: Response) {
  const assetId = parseInt(String(req.params.assetId));
  const data = await assetsService.createRiskAssessment(assetId, req.user!.id, req.body);
  res.status(201).json({ data });
}
