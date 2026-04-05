import type { Request, Response } from 'express';
import * as implementationService from './implementation.service';

export async function listControls(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const themeId = req.query.themeId ? parseInt(req.query.themeId as string) : undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const result = await implementationService.listImplementationControls({ companyId, page, limit, themeId, status, search });
  res.json(result);
}

export async function getControlDetail(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));

  const data = await implementationService.getImplementationDetail(companyId, controlId);
  if (!data) {
    res.status(404).json({ error: 'Control no encontrado para esta empresa' });
    return;
  }
  res.json({ data });
}

export async function updateTask(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));
  const taskId = parseInt(String(req.params.taskId));
  const { status, notes } = req.body as { status?: string; notes?: string };

  try {
    const data = await implementationService.updateImplementationTask(companyId, controlId, taskId, {
      status: status as implementationService.TaskStatus,
      notes,
    });
    res.json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ error: 'Tarea no encontrada' });
      return;
    }
    throw error;
  }
}

export async function addNote(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const controlId = parseInt(String(req.params.controlId));
  const userId = (req as Request & { user?: { userId: number } }).user?.userId;
  const { content } = req.body as { content: string };

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: 'El contenido de la nota no puede estar vacío' });
    return;
  }

  try {
    const data = await implementationService.addImplementationNote(companyId, controlId, userId!, content.trim());
    res.status(201).json({ data });
  } catch (error) {
    if (error instanceof Error && error.message === 'CompanyControl not found') {
      res.status(404).json({ error: 'Control no encontrado para esta empresa' });
      return;
    }
    throw error;
  }
}

export async function getSummary(req: Request, res: Response) {
  const companyId = parseInt(String(req.params.companyId));
  const data = await implementationService.getImplementationSummary(companyId);
  res.json({ data });
}
