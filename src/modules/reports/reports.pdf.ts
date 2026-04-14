import PDFDocument from 'pdfkit';
import type { CompanyReportData } from './reports.service';
import type { Writable } from 'stream';

const COLORS = {
  primary: '#1B4F72',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  gray: '#7F8C8D',
  lightGray: '#ECF0F1',
  text: '#2C3E50',
  white: '#FFFFFF',
};

const RISK_LABELS: Record<string, string> = {
  low: 'Bajo', medium: 'Medio', high: 'Alto', critical: 'Crítico', none: 'Sin evaluar',
};

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planificada', in_progress: 'En progreso', completed: 'Completada',
  implemented: 'Implementado', pending: 'Pendiente',
};

function drawTableRow(doc: PDFKit.PDFDocument, y: number, cols: Array<{ text: string; width: number; x: number; align?: string }>, opts?: { bold?: boolean; bg?: string }) {
  if (opts?.bg) {
    doc.save().rect(cols[0].x - 5, y - 3, cols.reduce((s, c) => s + c.width, 0) + 10, 18).fill(opts.bg).restore();
  }
  doc.font(opts?.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(COLORS.text);
  for (const col of cols) {
    doc.text(col.text, col.x, y, { width: col.width, align: (col.align as any) ?? 'left' });
  }
  return y + 18;
}

export function generatePdf(data: CompanyReportData, stream: Writable) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  doc.pipe(stream);

  const pageWidth = doc.page.width - 100;

  // --- Cover ---
  doc.moveDown(6);
  doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('Informe de Cumplimiento', { align: 'center' });
  doc.fontSize(14).fillColor(COLORS.gray).font('Helvetica')
    .text('ISO 27001:2022', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold')
    .text(data.company.name, { align: 'center' });
  doc.fontSize(12).fillColor(COLORS.gray).font('Helvetica')
    .text(`Sector: ${data.company.sectorName} | País: ${data.company.country}`, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).fillColor(COLORS.gray)
    .text(`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });

  doc.moveDown(4);
  doc.save()
    .rect(50, doc.y, pageWidth, 3).fill(COLORS.primary)
    .restore();

  // --- Section 1: Compliance Summary ---
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('1. Resumen de Cumplimiento');
  doc.moveDown(0.5);
  doc.save()
    .rect(50, doc.y, pageWidth, 2).fill(COLORS.primary)
    .restore();
  doc.moveDown(1);

  const { compliance } = data;
  const compItems = [
    ['Cumplimiento general', `${compliance.compliancePercentage}%`],
    ['Total de controles', `${compliance.totalControls}`],
    ['Controles implementados', `${compliance.implemented}`],
    ['Controles en progreso', `${compliance.inProgress}`],
    ['Controles pendientes', `${compliance.pending}`],
  ];

  for (const [label, value] of compItems) {
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
      .text(`${label}: `, { continued: true })
      .font('Helvetica-Bold').text(value);
    doc.moveDown(0.3);
  }

  // --- Section 2: Domain Breakdown ---
  doc.moveDown(1.5);
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('2. Estado por Dominio ISO');
  doc.moveDown(0.5);
  doc.save()
    .rect(50, doc.y, pageWidth, 2).fill(COLORS.primary)
    .restore();
  doc.moveDown(1);

  const domainCols = [
    { x: 50, width: 160, text: 'Dominio' },
    { x: 210, width: 80, text: 'Implementado', align: 'center' },
    { x: 290, width: 80, text: 'En progreso', align: 'center' },
    { x: 370, width: 80, text: 'Pendiente', align: 'center' },
    { x: 450, width: 60, text: 'Total', align: 'center' },
  ];

  let y = drawTableRow(doc, doc.y, domainCols.map(c => ({ ...c })), { bold: true, bg: COLORS.lightGray });

  for (const d of data.domainBreakdown) {
    if (y > 720) { doc.addPage(); y = 60; }
    y = drawTableRow(doc, y, [
      { x: 50, width: 160, text: d.theme },
      { x: 210, width: 80, text: `${d.implemented}`, align: 'center' },
      { x: 290, width: 80, text: `${d.inProgress}`, align: 'center' },
      { x: 370, width: 80, text: `${d.pending}`, align: 'center' },
      { x: 450, width: 60, text: `${d.total}`, align: 'center' },
    ]);
  }

  // --- Section 3: Assets & Risks ---
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('3. Activos y Riesgos');
  doc.moveDown(0.5);
  doc.save()
    .rect(50, doc.y, pageWidth, 2).fill(COLORS.primary)
    .restore();
  doc.moveDown(1);

  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
    .text(`Total de activos: `, { continued: true })
    .font('Helvetica-Bold').text(`${data.assets.total}`);
  doc.moveDown(0.5);

  doc.fontSize(11).font('Helvetica').text('Distribución de riesgo:');
  for (const r of data.assets.byRisk) {
    doc.text(`  ${RISK_LABELS[r.level] ?? r.level}: ${r.count}`);
  }
  doc.moveDown(1);

  if (data.assets.items.length > 0) {
    doc.fontSize(13).font('Helvetica-Bold').text('Detalle de activos');
    doc.moveDown(0.5);

    const assetCols = [
      { x: 50, width: 140, text: 'Nombre' },
      { x: 190, width: 80, text: 'Tipo', align: 'center' },
      { x: 270, width: 90, text: 'Clasificación', align: 'center' },
      { x: 360, width: 70, text: 'Riesgo', align: 'center' },
      { x: 430, width: 70, text: 'Estado', align: 'center' },
    ];

    y = drawTableRow(doc, doc.y, assetCols, { bold: true, bg: COLORS.lightGray });

    for (const a of data.assets.items) {
      if (y > 720) { doc.addPage(); y = 60; }
      y = drawTableRow(doc, y, [
        { x: 50, width: 140, text: a.name },
        { x: 190, width: 80, text: a.type, align: 'center' },
        { x: 270, width: 90, text: a.classification, align: 'center' },
        { x: 360, width: 70, text: RISK_LABELS[a.riskLevel] ?? a.riskLevel, align: 'center' },
        { x: 430, width: 70, text: a.status, align: 'center' },
      ]);
    }
  }

  // --- Section 4: Audits ---
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('4. Resultados de Auditorías');
  doc.moveDown(0.5);
  doc.save()
    .rect(50, doc.y, pageWidth, 2).fill(COLORS.primary)
    .restore();
  doc.moveDown(1);

  if (data.audits.length === 0) {
    doc.fontSize(11).fillColor(COLORS.gray).font('Helvetica').text('No se encontraron auditorías registradas.');
  } else {
    const auditCols = [
      { x: 50, width: 80, text: 'Fecha' },
      { x: 130, width: 90, text: 'Estado', align: 'center' },
      { x: 220, width: 120, text: 'Auditor' },
      { x: 340, width: 60, text: 'Controles', align: 'center' },
      { x: 400, width: 60, text: 'Conforme', align: 'center' },
      { x: 460, width: 70, text: 'No conforme', align: 'center' },
    ];

    y = drawTableRow(doc, doc.y, auditCols, { bold: true, bg: COLORS.lightGray });

    for (const a of data.audits) {
      if (y > 720) { doc.addPage(); y = 60; }
      y = drawTableRow(doc, y, [
        { x: 50, width: 80, text: a.date },
        { x: 130, width: 90, text: STATUS_LABELS[a.status] ?? a.status, align: 'center' },
        { x: 220, width: 120, text: a.auditorName },
        { x: 340, width: 60, text: `${a.totalControls}`, align: 'center' },
        { x: 400, width: 60, text: `${a.compliant}`, align: 'center' },
        { x: 460, width: 70, text: `${a.nonCompliant}`, align: 'center' },
      ]);
    }
  }

  // --- Footer on all pages ---
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica')
      .text(
        `Fix-ISO — Informe generado el ${new Date(data.generatedAt).toLocaleDateString('es-CO')} — Página ${i + 1} de ${pages.count}`,
        50, doc.page.height - 40,
        { width: pageWidth, align: 'center' },
      );
  }

  doc.end();
}
