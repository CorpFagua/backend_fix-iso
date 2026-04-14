import ExcelJS from 'exceljs';
import type { CompanyReportData } from './reports.service';
import type { Writable } from 'stream';

const RISK_LABELS: Record<string, string> = {
  low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico', none: 'Sin evaluar',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planificada', in_progress: 'En progreso', completed: 'Completada',
  implemented: 'Implementado', pending: 'Pendiente',
};

const PRIMARY_COLOR = '1B4F72';
const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${PRIMARY_COLOR}` } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

function addHeaderRow(sheet: ExcelJS.Worksheet, values: string[]) {
  const row = sheet.addRow(values);
  row.eachCell(cell => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin' } };
  });
  return row;
}

export async function generateExcel(data: CompanyReportData, stream: Writable) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Fix-ISO';
  wb.created = new Date(data.generatedAt);

  // --- Sheet 1: Resumen ---
  const ws1 = wb.addWorksheet('Resumen');
  ws1.columns = [
    { header: '', key: 'label', width: 30 },
    { header: '', key: 'value', width: 20 },
  ];

  ws1.addRow(['Informe de Cumplimiento ISO 27001:2022']).font = { bold: true, size: 16, color: { argb: `FF${PRIMARY_COLOR}` } };
  ws1.addRow([]);
  ws1.addRow(['Empresa', data.company.name]);
  ws1.addRow(['Sector', data.company.sectorName]);
  ws1.addRow(['País', data.company.country]);
  ws1.addRow(['Fecha de generación', new Date(data.generatedAt).toLocaleDateString('es-CO')]);
  ws1.addRow([]);
  ws1.addRow(['Cumplimiento general', `${data.compliance.compliancePercentage}%`]).font = { bold: true };
  ws1.addRow(['Total de controles', data.compliance.totalControls]);
  ws1.addRow(['Implementados', data.compliance.implemented]);
  ws1.addRow(['En progreso', data.compliance.inProgress]);
  ws1.addRow(['Pendientes', data.compliance.pending]);

  ws1.mergeCells('A1:B1');

  // --- Sheet 2: Dominios ---
  const ws2 = wb.addWorksheet('Dominios ISO');
  ws2.columns = [
    { key: 'theme', width: 25 },
    { key: 'implemented', width: 16 },
    { key: 'inProgress', width: 16 },
    { key: 'pending', width: 16 },
    { key: 'total', width: 12 },
  ];

  addHeaderRow(ws2, ['Dominio', 'Implementado', 'En progreso', 'Pendiente', 'Total']);

  for (const d of data.domainBreakdown) {
    ws2.addRow([d.theme, d.implemented, d.inProgress, d.pending, d.total]);
  }
  ws2.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

  // --- Sheet 3: Activos ---
  const ws3 = wb.addWorksheet('Activos y Riesgos');
  ws3.columns = [
    { key: 'name', width: 30 },
    { key: 'type', width: 15 },
    { key: 'classification', width: 15 },
    { key: 'riskLevel', width: 15 },
    { key: 'status', width: 15 },
  ];

  addHeaderRow(ws3, ['Nombre', 'Tipo', 'Clasificación', 'Nivel de Riesgo', 'Estado']);

  for (const a of data.assets.items) {
    ws3.addRow([a.name, a.type, a.classification, RISK_LABELS[a.riskLevel] ?? a.riskLevel, a.status]);
  }
  ws3.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

  // --- Sheet 4: Auditorías ---
  const ws4 = wb.addWorksheet('Auditorías');
  ws4.columns = [
    { key: 'date', width: 15 },
    { key: 'status', width: 16 },
    { key: 'auditor', width: 25 },
    { key: 'totalControls', width: 14 },
    { key: 'compliant', width: 14 },
    { key: 'nonCompliant', width: 14 },
  ];

  addHeaderRow(ws4, ['Fecha', 'Estado', 'Auditor', 'Controles', 'Conforme', 'No Conforme']);

  for (const a of data.audits) {
    ws4.addRow([a.date, STATUS_LABELS[a.status] ?? a.status, a.auditorName, a.totalControls, a.compliant, a.nonCompliant]);
  }
  ws4.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

  await wb.xlsx.write(stream);
}
