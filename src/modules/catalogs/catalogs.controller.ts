import type { Request, Response } from 'express';
import prisma from '../../config/database';

export async function listSectors(_req: Request, res: Response) {
  const data = await prisma.sector.findMany({ orderBy: { id: 'asc' } });
  res.json({ data });
}

export async function listCompanySizes(_req: Request, res: Response) {
  const data = await prisma.companySize.findMany({ orderBy: { id: 'asc' } });
  res.json({ data });
}
