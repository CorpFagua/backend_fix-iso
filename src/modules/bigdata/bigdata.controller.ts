import type { Request, Response } from 'express';
import { bigdataService } from './bigdata.service';

function handleError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'BigData service error';
  if (message.includes('404')) {
    return res.status(404).json({ error: 'Analytics data not available. Run the pipeline first.' });
  }
  if (message.includes('AbortError') || message.includes('abort')) {
    return res.status(504).json({ error: 'BigData service timeout' });
  }
  return res.status(502).json({ error: message });
}

export async function getThreatMap(req: Request, res: Response) {
  try {
    const data = await bigdataService.getThreatMap();
    res.json({ data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getThreatTimeline(req: Request, res: Response) {
  try {
    const data = await bigdataService.getThreatTimeline();
    res.json({ data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getMitreIsoCorrelation(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : 0;
  try {
    const data = await bigdataService.getMitreIsoCorrelation(companyId);
    res.json({ data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getCompanyRiskScore(req: Request, res: Response) {
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : 0;
  try {
    const data = await bigdataService.getCompanyRiskScore(companyId);
    res.json({ data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function runPipeline(req: Request, res: Response) {
  try {
    const data = await bigdataService.runPipeline();
    res.json({ data });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getHealth(req: Request, res: Response) {
  try {
    const data = await bigdataService.health();
    res.json({ data });
  } catch (err) {
    res.status(503).json({ error: 'BigData service unreachable' });
  }
}
