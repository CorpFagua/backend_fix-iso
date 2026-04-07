import type { Request, Response } from 'express';
import * as trainingsService from './trainings.service';

// ─── Admin endpoints ────────────────────────────────

export async function listTrainings(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const trainingType = req.query.trainingType as string | undefined;

  const result = await trainingsService.getTrainings({ search, trainingType, page, limit });
  res.json(result);
}

export async function getTraining(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await trainingsService.getTrainingById(id);
  if (!data) {
    res.status(404).json({ error: 'Capacitación no encontrada' });
    return;
  }
  res.json({ data });
}

export async function createTraining(req: Request, res: Response) {
  const { title, description, trainingType, resourcesJson } = req.body;

  if (!title || !trainingType) {
    res.status(400).json({ error: 'Título y tipo de capacitación son requeridos' });
    return;
  }

  const validTypes = ['ORGANIZATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL', 'PROCESS'];
  if (!validTypes.includes(trainingType)) {
    res.status(400).json({ error: 'Tipo de capacitación no válido' });
    return;
  }

  const data = await trainingsService.createTraining(req.user!.id, {
    title,
    description,
    trainingType,
    resourcesJson,
  });
  res.status(201).json({ data });
}

export async function updateTraining(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const { title, description, trainingType, resourcesJson } = req.body;

  if (trainingType) {
    const validTypes = ['ORGANIZATIONAL', 'PEOPLE', 'PHYSICAL', 'TECHNOLOGICAL', 'PROCESS'];
    if (!validTypes.includes(trainingType)) {
      res.status(400).json({ error: 'Tipo de capacitación no válido' });
      return;
    }
  }

  const data = await trainingsService.updateTraining(id, { title, description, trainingType, resourcesJson });
  res.json({ data });
}

export async function deleteTraining(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  await trainingsService.deleteTraining(id);
  res.status(204).end();
}

// ─── Company-scoped endpoints ───────────────────────

export async function listCompanyTrainings(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await trainingsService.getCompanyTrainings(companyId);
  res.json({ data });
}

export async function getCompanyTrainingDetail(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const trainingId = parseInt(String(req.params.trainingId));
  const data = await trainingsService.getCompanyTrainingDetail(companyId, trainingId);
  if (!data) {
    res.status(404).json({ error: 'Capacitación no encontrada para esta empresa' });
    return;
  }
  res.json({ data });
}

export async function assignTraining(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const { trainingId } = req.body;
  if (!trainingId) {
    res.status(400).json({ error: 'trainingId es requerido' });
    return;
  }
  const data = await trainingsService.assignTrainingToCompany(trainingId, companyId, req.user!.id);
  res.status(201).json({ data });
}

export async function removeTraining(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const trainingId = parseInt(String(req.params.trainingId));
  await trainingsService.removeTrainingFromCompany(companyId, trainingId);
  res.status(204).end();
}

export async function availableTrainings(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await trainingsService.getAvailableTrainingsForCompany(companyId);
  res.json({ data });
}

export async function enrollUser(req: Request, res: Response) {
  const { companyTrainingId } = req.body;
  if (!companyTrainingId) {
    res.status(400).json({ error: 'companyTrainingId es requerido' });
    return;
  }
  const data = await trainingsService.enrollUser(companyTrainingId, req.user!.id);
  res.status(201).json({ data });
}

export async function updateEnrollmentStatus(req: Request, res: Response) {
  const enrollmentId = parseInt(String(req.params.enrollmentId));
  const { status } = req.body;
  if (!status || !['PENDING', 'COMPLETED'].includes(status)) {
    res.status(400).json({ error: 'Estado debe ser PENDING o COMPLETED' });
    return;
  }
  const data = await trainingsService.updateEnrollmentStatus(enrollmentId, status);
  res.json({ data });
}
