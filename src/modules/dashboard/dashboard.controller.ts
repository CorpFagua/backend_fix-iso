import type { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';

export async function getStats(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const data = await dashboardService.getStats(companyId);
  res.json({ data });
}

export async function getComplianceProgress(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const data = await dashboardService.getComplianceProgress(companyId);
  res.json({ data });
}

export async function getRiskOverview(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const data = await dashboardService.getRiskOverview(companyId);
  res.json({ data });
}

export async function getRecentActivity(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
  const data = await dashboardService.getRecentActivity(companyId);
  res.json({ data });
}

export async function getGlobalSummary(_req: Request, res: Response) {
  const data = await dashboardService.getGlobalSummary();
  res.json({ data });
}
