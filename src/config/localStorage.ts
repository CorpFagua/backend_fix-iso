import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function sanitizePathSegment(segment: string): string {
  const sanitized = segment.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitized) {
    throw new Error('Invalid path segment');
  }
  return sanitized;
}

function assertPathInsideUploads(targetPath: string): string {
  const resolvedUploads = path.resolve(UPLOADS_DIR);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedUploads, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file path');
  }
  return resolvedTarget;
}

/** Ensure the uploads directory exists */
function ensureDir(dir: string) {
  const safeDir = assertPathInsideUploads(dir);
  if (!fs.existsSync(safeDir)) {
    fs.mkdirSync(safeDir, { recursive: true });
  }
}

/** Build a sub-directory path: uploads/{companyId}/{docType} */
function buildPath(companyId: number, docType: string): string {
  const safeDocType = sanitizePathSegment(docType);
  const dir = assertPathInsideUploads(path.join(UPLOADS_DIR, String(companyId), safeDocType));
  ensureDir(dir);
  return dir;
}

/** Save a file to local storage. Returns relative path and a local URL. */
export function saveFile(
  buffer: Buffer,
  originalName: string,
  companyId: number,
  docType: string,
): { filePath: string; url: string } {
  const dir = buildPath(companyId, docType);
  const ext = path.extname(originalName);
  const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
  const fullPath = path.join(dir, safeName);

  fs.writeFileSync(fullPath, buffer);

  const relativePath = path.relative(UPLOADS_DIR, fullPath);
  return {
    filePath: relativePath,
    url: `/uploads/${relativePath}`,
  };
}

/** Delete a file from local storage */
export function deleteLocalFile(relativePath: string): void {
  const fullPath = assertPathInsideUploads(path.join(UPLOADS_DIR, relativePath));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export { UPLOADS_DIR };
