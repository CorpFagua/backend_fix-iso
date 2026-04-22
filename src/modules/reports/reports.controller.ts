import type { Request, Response, NextFunction } from 'express';
import { getCompanyReportData, getTrainingsReportData, getAuditsReportData, getImplementationReportData } from './reports.service';
import { generatePdf, generateTrainingsPdf, generateAuditsPdf, generateImplementationPdf } from './reports.pdf';
import { generateExcel } from './reports.excel';
import { generateTrainingsCsv, generateAuditsCsv, generateImplementationCsv } from './reports.csv';

export async function downloadReport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = Number(req.params.companyId);
    const format = (req.query.format as string)?.toLowerCase() ?? 'pdf';

    if (!['pdf', 'xlsx'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Use pdf o xlsx' });
    }

    const data = await getCompanyReportData(companyId);
    const safeName = data.company.name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_');
    const fileName = `Informe_${safeName}_${data.generatedAt.split('T')[0]}`;

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      generatePdf(data, res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xlsx"`);
      await generateExcel(data, res);
      res.end();
    }
  } catch (err) { next(err); }
}

function buildSafeName(companyName: string, section: string, generatedAt: string, ext: string): string {
  const safe = companyName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').replace(/\s+/g, '_');
  return `${section}_${safe}_${generatedAt.split('T')[0]}.${ext}`;
}

export async function downloadTrainingsReport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = Number(req.params.companyId);
    const format = (req.query.format as string)?.toLowerCase() ?? 'pdf';

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Use pdf o csv' });
    }

    const data = await getTrainingsReportData(companyId);
    const fileName = buildSafeName(data.company.name, 'Capacitaciones', data.generatedAt, format);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      generateTrainingsPdf(data, res);
    } else {
      const csv = generateTrainingsCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    }
  } catch (err) { next(err); }
}

export async function downloadAuditsReport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = Number(req.params.companyId);
    const format = (req.query.format as string)?.toLowerCase() ?? 'pdf';

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Use pdf o csv' });
    }

    const data = await getAuditsReportData(companyId);
    const fileName = buildSafeName(data.company.name, 'Auditorias', data.generatedAt, format);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      generateAuditsPdf(data, res);
    } else {
      const csv = generateAuditsCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send('\uFEFF' + csv);
    }
  } catch (err) { next(err); }
}

export async function downloadImplementationReport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = Number(req.params.companyId);
    const format = (req.query.format as string)?.toLowerCase() ?? 'pdf';

    if (!['pdf', 'csv'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Use pdf o csv' });
    }

    const data = await getImplementationReportData(companyId);
    const fileName = buildSafeName(data.company.name, 'Implementacion', data.generatedAt, format);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      generateImplementationPdf(data, res);
    } else {
      const csv = generateImplementationCsv(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send('\uFEFF' + csv);
    }
  } catch (err) { next(err); }
}
