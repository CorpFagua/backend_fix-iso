import type { Request, Response, NextFunction } from 'express';
import { getCompanyReportData } from './reports.service';
import { generatePdf } from './reports.pdf';
import { generateExcel } from './reports.excel';

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
