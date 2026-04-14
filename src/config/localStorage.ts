import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

/** Ensure the uploads directory exists */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Build a sub-directory path: uploads/{companyId}/{docType} */
function buildPath(companyId: number, docType: string): string {
  const dir = path.join(UPLOADS_DIR, String(companyId), docType);
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
  const fullPath = path.join(UPLOADS_DIR, relativePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export { UPLOADS_DIR };
