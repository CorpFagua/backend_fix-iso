import type { Request, Response, NextFunction } from 'express';
import * as documentsService from './documents.service';
import type { DocumentType } from '@prisma/client';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.query.companyId ? Number(req.query.companyId) : undefined;
    const documentType = req.query.type as DocumentType | undefined;
    const relatedEntityType = req.query.relatedEntityType as string | undefined;
    const relatedEntityId = req.query.relatedEntityId ? Number(req.query.relatedEntityId) : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await documentsService.listDocuments({ companyId, documentType, relatedEntityType, relatedEntityId, page, limit });
    res.json({ data: result.data, meta: result.meta });
  } catch (err) { next(err); }
}

export async function templates(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await documentsService.listTemplates();
    res.json({ data });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const doc = await documentsService.getDocumentById(id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ data: doc });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { companyId, name, description, documentType, driveFileId, driveUrl, driveFolderId, relatedEntityType, relatedEntityId } = req.body;
    const doc = await documentsService.createDocument({
      companyId: companyId ? Number(companyId) : undefined,
      name,
      description,
      documentType,
      driveFileId,
      driveUrl,
      driveFolderId,
      relatedEntityType,
      relatedEntityId: relatedEntityId ? Number(relatedEntityId) : undefined,
      createdById: userId,
    });
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
}

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No se envió archivo' });

    const { companyId, name, description, documentType, relatedEntityType, relatedEntityId } = req.body;

    if (!companyId || !name || !documentType) {
      return res.status(400).json({ error: 'Campos requeridos: companyId, name, documentType' });
    }

    const doc = await documentsService.uploadDocument({
      companyId: Number(companyId),
      name,
      description,
      documentType,
      relatedEntityType,
      relatedEntityId: relatedEntityId ? Number(relatedEntityId) : undefined,
      createdById: userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const { name, description, relatedEntityType, relatedEntityId } = req.body;
    const doc = await documentsService.updateDocument(id, {
      name,
      description,
      relatedEntityType,
      relatedEntityId: relatedEntityId ? Number(relatedEntityId) : undefined,
    });
    res.json({ data: doc });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const result = await documentsService.deleteDocument(id);
    if (!result) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ message: 'Documento eliminado' });
  } catch (err) { next(err); }
}

export async function initFolders(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = Number(req.params.companyId);
    const folders = await documentsService.initCompanyFolders(companyId);
    res.json({ data: folders });
  } catch (err) { next(err); }
}
