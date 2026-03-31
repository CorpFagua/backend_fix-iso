import type { Request, Response } from 'express';
import * as usersService from './users.service';

export async function listUsers(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const result = await usersService.getUsers({ page, limit, search });
  res.json(result);
}

export async function getUser(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await usersService.getUserById(id);
  if (!data) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  res.json({ data });
}

export async function createUser(req: Request, res: Response) {
  const data = await usersService.createUser(req.body);
  res.status(201).json({ data });
}

export async function updateUser(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const data = await usersService.updateUser(id, req.body);
  res.json({ data });
}

export async function deleteUser(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  await usersService.deactivateUser(id);
  res.status(204).end();
}
