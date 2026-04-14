import { google, drive_v3 } from 'googleapis';
import { env } from './env';
import fs from 'fs';
import { Readable } from 'stream';

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  let credentials: Record<string, unknown>;

  if (env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY) {
    credentials = JSON.parse(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY);
    // When loaded from an env var, \n in the private key may be literal "\\n" — fix them
    if (typeof credentials.private_key === 'string') {
      credentials.private_key = (credentials.private_key as string).replace(/\\n/g, '\n');
    }
  } else if (env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE) {
    const raw = fs.readFileSync(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE, 'utf-8');
    credentials = JSON.parse(raw);
  } else {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY or GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

export function isDriveConfigured(): boolean {
  return !!(env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY || env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE);
}

export async function createFolder(name: string, parentId: string): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: 'id, webViewLink',
  });
  return { id: res.data.id!, webViewLink: res.data.webViewLink! };
}

export async function listFiles(folderId: string) {
  const drive = getDriveClient();
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, webViewLink, size, createdTime)',
    orderBy: 'name',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files ?? [];
}

export async function uploadFile(
  name: string,
  mimeType: string,
  buffer: Buffer,
  folderId: string,
): Promise<{ id: string; webViewLink: string }> {
  const drive = getDriveClient();
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    supportsAllDrives: true,
    fields: 'id, webViewLink',
  });
  return { id: res.data.id!, webViewLink: res.data.webViewLink! };
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({ fileId, supportsAllDrives: true });
}

export async function getFileStream(fileId: string): Promise<Readable> {
  const drive = getDriveClient();
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' },
  );
  return res.data as unknown as Readable;
}

const DOCUMENT_TYPE_FOLDER_NAMES: Record<string, string> = {
  ACTA: 'Actas',
  REPORTE_AUDITORIA: 'Reportes de Auditoría',
  EVIDENCIA: 'Evidencias',
  POLITICA: 'Políticas',
  PLAN_TRATAMIENTO: 'Planes de Tratamiento',
  INFORME_CAPACITACION: 'Informes de Capacitación',
  PLANTILLA: 'Plantillas',
};

export async function initCompanyFolders(companyName: string): Promise<Record<string, string>> {
  const companiesParentId = env.GOOGLE_DRIVE_COMPANIES_FOLDER_ID;
  if (!companiesParentId) throw new Error('GOOGLE_DRIVE_COMPANIES_FOLDER_ID not configured');

  const companyFolder = await createFolder(companyName, companiesParentId);

  const folderIds: Record<string, string> = { root: companyFolder.id };
  const typeFolders = ['ACTA', 'REPORTE_AUDITORIA', 'EVIDENCIA', 'POLITICA', 'PLAN_TRATAMIENTO', 'INFORME_CAPACITACION'];

  for (const type of typeFolders) {
    const folder = await createFolder(DOCUMENT_TYPE_FOLDER_NAMES[type], companyFolder.id);
    folderIds[type] = folder.id;
  }

  return folderIds;
}

export function getDocTypeFolderName(docType: string): string {
  return DOCUMENT_TYPE_FOLDER_NAMES[docType] ?? docType;
}
