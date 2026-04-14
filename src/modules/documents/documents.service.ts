import prisma from '../../config/database';
import { DocumentType } from '@prisma/client';
import * as drive from '../../config/googleDrive';
import * as local from '../../config/localStorage';

interface ListDocumentsParams {
  companyId?: number;
  documentType?: DocumentType;
  relatedEntityType?: string;
  relatedEntityId?: number;
  page?: number;
  limit?: number;
}

export async function listDocuments(params: ListDocumentsParams) {
  const { companyId, documentType, relatedEntityType, relatedEntityId, page = 1, limit = 20 } = params;

  const where: Record<string, unknown> = {};
  if (companyId !== undefined) where.companyId = companyId;
  if (documentType) where.documentType = documentType;
  if (relatedEntityType) where.relatedEntityType = relatedEntityType;
  if (relatedEntityId) where.relatedEntityId = relatedEntityId;

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function listTemplates() {
  return prisma.document.findMany({
    where: { companyId: null, documentType: 'PLANTILLA' },
    include: { createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocumentById(id: number) {
  return prisma.document.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

interface CreateDocumentInput {
  companyId?: number;
  name: string;
  description?: string;
  documentType: DocumentType;
  driveFileId?: string;
  driveUrl?: string;
  driveFolderId?: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdById: number;
}

export async function createDocument(input: CreateDocumentInput) {
  return prisma.document.create({
    data: input,
    include: {
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

interface UploadDocumentInput {
  companyId: number;
  name: string;
  description?: string;
  documentType: DocumentType;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdById: number;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

/** Resolve the Drive folder for a company+type from existing docs, then env fallback. */
async function resolveFolderId(companyId: number, documentType: DocumentType): Promise<string | null> {
  // 1. Reuse folder from a previous document of the same company+type
  const existing = await prisma.document.findFirst({
    where: { companyId, documentType, driveFolderId: { not: null } },
    select: { driveFolderId: true },
  });
  if (existing?.driveFolderId) return existing.driveFolderId;

  // 2. Fall back to the companies root folder from env
  const { GOOGLE_DRIVE_COMPANIES_FOLDER_ID, GOOGLE_DRIVE_ROOT_FOLDER_ID } = process.env;
  return GOOGLE_DRIVE_COMPANIES_FOLDER_ID ?? GOOGLE_DRIVE_ROOT_FOLDER_ID ?? null;
}

export async function uploadDocument(input: UploadDocumentInput) {
  const { companyId, name, description, documentType, relatedEntityType, relatedEntityId, createdById, fileName, mimeType, buffer } = input;

  let driveFileId: string | null = null;
  let driveUrl: string | null = null;
  let driveFolderId: string | null = null;

  if (drive.isDriveConfigured()) {
    // Try Google Drive first
    const folderId = await resolveFolderId(companyId, documentType);
    if (folderId) {
      try {
        const result = await drive.uploadFile(fileName, mimeType, buffer, folderId);
        driveFileId = result.id;
        driveUrl = result.webViewLink;
        driveFolderId = folderId;
      } catch (driveErr) {
        // Drive failed (e.g. quota issue) — fall back to local storage
        console.warn('[Documents] Google Drive upload failed, using local storage:', (driveErr as Error).message);
        const localResult = local.saveFile(buffer, fileName, companyId, documentType);
        driveUrl = localResult.url;
        driveFileId = localResult.filePath; // store relative path as ID for deletion
      }
    }
  } else {
    // No Drive configured — use local storage
    const localResult = local.saveFile(buffer, fileName, companyId, documentType);
    driveUrl = localResult.url;
    driveFileId = localResult.filePath;
  }

  return prisma.document.create({
    data: {
      companyId,
      name,
      description,
      documentType,
      driveFileId,
      driveUrl,
      driveFolderId,
      relatedEntityType,
      relatedEntityId,
      createdById,
    },
    include: {
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function updateDocument(id: number, data: { name?: string; description?: string; relatedEntityType?: string; relatedEntityId?: number }) {
  return prisma.document.update({
    where: { id },
    data,
    include: {
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function deleteDocument(id: number) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return null;

  if (doc.driveFileId) {
    if (doc.driveFolderId && drive.isDriveConfigured()) {
      // File is on Google Drive
      try {
        await drive.deleteFile(doc.driveFileId);
      } catch {
        // file may already be deleted from Drive
      }
    } else {
      // File is local — driveFileId stores the relative path
      try {
        local.deleteLocalFile(doc.driveFileId);
      } catch {
        // file may already be deleted
      }
    }
  }

  return prisma.document.delete({ where: { id } });
}

export async function initCompanyFolders(companyId: number) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  return drive.initCompanyFolders(company.name);
}
