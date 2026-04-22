import PDFDocument from 'pdfkit';
import type { CompanyReportData, TrainingsReportData, AuditsReportData, ImplementationReportData } from './reports.service';
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

// ─── Trainings PDF ───────────────────────────────────────────────────────────

const TRAINING_TYPE_LABELS: Record<string, string> = {
  ORGANIZATIONAL: 'Controles Organizativos',
  PEOPLE: 'Controles de Personas',
  PHYSICAL: 'Controles Físicos',
  TECHNOLOGICAL: 'Controles Tecnológicos',
  PROCESS: 'De Procesos',
};

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
};

export function generateTrainingsPdf(data: TrainingsReportData, stream: Writable) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  doc.pipe(stream);
  const pageWidth = doc.page.width - 100;

  // Cover
  doc.moveDown(6);
  doc.fontSize(26).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('Reporte de Capacitaciones', { align: 'center' });
  doc.fontSize(14).fillColor(COLORS.gray).font('Helvetica')
    .text('ISO 27001:2022', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold')
    .text(data.company.name, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).fillColor(COLORS.gray)
    .text(`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(4);
  doc.save().rect(50, doc.y, pageWidth, 3).fill(COLORS.primary).restore();

  // Summary section
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('1. Resumen de Capacitaciones');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const totalCapacitaciones = data.items.length;
  const totalInscritos = data.items.reduce((s, i) => s + i.totalEnrolled, 0);
  const totalCompletados = data.items.reduce((s, i) => s + i.totalCompleted, 0);
  const pctGeneral = totalInscritos > 0 ? Math.round((totalCompletados / totalInscritos) * 100) : 0;

  for (const [label, value] of [
    ['Total capacitaciones asignadas', `${totalCapacitaciones}`],
    ['Total inscripciones', `${totalInscritos}`],
    ['Inscripciones completadas', `${totalCompletados}`],
    ['Tasa de completitud', `${pctGeneral}%`],
  ] as [string, string][]) {
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
      .text(`${label}: `, { continued: true })
      .font('Helvetica-Bold').text(value);
    doc.moveDown(0.3);
  }

  doc.moveDown(1.5);
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('2. Detalle por Capacitación');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const trainingCols = [
    { x: 50, width: 170, text: 'Título' },
    { x: 220, width: 100, text: 'Tipo', align: 'center' },
    { x: 320, width: 80, text: 'Asignado', align: 'center' },
    { x: 400, width: 60, text: 'Inscritos', align: 'center' },
    { x: 460, width: 60, text: 'Completos', align: 'center' },
  ];
  let y = drawTableRow(doc, doc.y, trainingCols, { bold: true, bg: COLORS.lightGray });
  for (const item of data.items) {
    if (y > 720) { doc.addPage(); y = 60; }
    y = drawTableRow(doc, y, [
      { x: 50, width: 170, text: item.title },
      { x: 220, width: 100, text: TRAINING_TYPE_LABELS[item.trainingType] ?? item.trainingType, align: 'center' },
      { x: 320, width: 80, text: item.assignedAt, align: 'center' },
      { x: 400, width: 60, text: `${item.totalEnrolled}`, align: 'center' },
      { x: 460, width: 60, text: `${item.totalCompleted}`, align: 'center' },
    ]);
  }

  // Enrollment detail
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('3. Detalle de Inscripciones');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const enrollCols = [
    { x: 50, width: 140, text: 'Capacitación' },
    { x: 190, width: 110, text: 'Participante' },
    { x: 300, width: 80, text: 'Estado', align: 'center' },
    { x: 380, width: 75, text: 'Inscrito el', align: 'center' },
    { x: 455, width: 75, text: 'Completado', align: 'center' },
  ];
  y = drawTableRow(doc, doc.y, enrollCols, { bold: true, bg: COLORS.lightGray });
  for (const item of data.items) {
    if (item.enrollments.length === 0) continue;
    for (const e of item.enrollments) {
      if (y > 720) { doc.addPage(); y = 60; }
      y = drawTableRow(doc, y, [
        { x: 50, width: 140, text: item.title },
        { x: 190, width: 110, text: e.userName },
        { x: 300, width: 80, text: ENROLLMENT_STATUS_LABELS[e.status] ?? e.status, align: 'center' },
        { x: 380, width: 75, text: e.enrolledAt, align: 'center' },
        { x: 455, width: 75, text: e.completedAt ?? '—', align: 'center' },
      ]);
    }
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica')
      .text(
        `Fix-ISO — Reporte de Capacitaciones — ${data.company.name} — Página ${i + 1} de ${pages.count}`,
        50, doc.page.height - 40, { width: pageWidth, align: 'center' },
      );
  }
  doc.end();
}

// ─── Audits PDF ───────────────────────────────────────────────────────────────

const AUDIT_STATUS_LABELS_PDF: Record<string, string> = {
  planned: 'Planificada', in_progress: 'En progreso', completed: 'Completada',
};

const AUDIT_RESULT_LABELS_PDF: Record<string, string> = {
  compliant: 'Conforme', non_compliant: 'No conforme', not_evaluated: 'No evaluado',
};

export function generateAuditsPdf(data: AuditsReportData, stream: Writable) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  doc.pipe(stream);
  const pageWidth = doc.page.width - 100;

  // Cover
  doc.moveDown(6);
  doc.fontSize(26).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('Reporte de Auditorías', { align: 'center' });
  doc.fontSize(14).fillColor(COLORS.gray).font('Helvetica').text('ISO 27001:2022', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold').text(data.company.name, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).fillColor(COLORS.gray)
    .text(`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(4);
  doc.save().rect(50, doc.y, pageWidth, 3).fill(COLORS.primary).restore();

  // Summary
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('1. Resumen de Auditorías');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const totalAudits = data.audits.length;
  const completed = data.audits.filter(a => a.status === 'completed').length;
  const totalControls = data.audits.reduce((s, a) => s + a.totalControls, 0);
  const totalCompliant = data.audits.reduce((s, a) => s + a.compliant, 0);
  const complianceRate = totalControls > 0 ? Math.round((totalCompliant / totalControls) * 100) : 0;

  for (const [label, value] of [
    ['Total auditorías', `${totalAudits}`],
    ['Auditorías completadas', `${completed}`],
    ['Total controles evaluados', `${totalControls}`],
    ['Controles conformes', `${totalCompliant} (${complianceRate}%)`],
  ] as [string, string][]) {
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
      .text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(value);
    doc.moveDown(0.3);
  }

  doc.moveDown(1.5);
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('2. Listado de Auditorías');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const auditListCols = [
    { x: 50, width: 70, text: 'Fecha' },
    { x: 120, width: 100, text: 'Auditor' },
    { x: 220, width: 90, text: 'Estado', align: 'center' },
    { x: 310, width: 60, text: 'Controles', align: 'center' },
    { x: 370, width: 60, text: 'Conformes', align: 'center' },
    { x: 430, width: 70, text: 'No Conformes', align: 'center' },
  ];
  let y = drawTableRow(doc, doc.y, auditListCols, { bold: true, bg: COLORS.lightGray });
  for (const a of data.audits) {
    if (y > 720) { doc.addPage(); y = 60; }
    y = drawTableRow(doc, y, [
      { x: 50, width: 70, text: a.date },
      { x: 120, width: 100, text: a.auditorName },
      { x: 220, width: 90, text: AUDIT_STATUS_LABELS_PDF[a.status] ?? a.status, align: 'center' },
      { x: 310, width: 60, text: `${a.totalControls}`, align: 'center' },
      { x: 370, width: 60, text: `${a.compliant}`, align: 'center' },
      { x: 430, width: 70, text: `${a.nonCompliant}`, align: 'center' },
    ]);
  }

  // Detail per audit
  for (const audit of data.audits) {
    doc.addPage();
    doc.fontSize(14).fillColor(COLORS.primary).font('Helvetica-Bold')
      .text(`Auditoría — ${audit.date} — ${audit.auditorName}`);
    doc.fontSize(10).fillColor(COLORS.gray).font('Helvetica')
      .text(`Estado: ${AUDIT_STATUS_LABELS_PDF[audit.status] ?? audit.status}`);
    if (audit.notes) doc.text(`Notas: ${audit.notes}`);
    doc.moveDown(0.8);

    const resultCols = [
      { x: 50, width: 50, text: 'Código' },
      { x: 100, width: 170, text: 'Control' },
      { x: 270, width: 100, text: 'Dominio' },
      { x: 370, width: 80, text: 'Resultado', align: 'center' },
      { x: 450, width: 105, text: 'Comentarios' },
    ];
    y = drawTableRow(doc, doc.y, resultCols, { bold: true, bg: COLORS.lightGray });
    for (const r of audit.results) {
      if (y > 720) { doc.addPage(); y = 60; }
      y = drawTableRow(doc, y, [
        { x: 50, width: 50, text: r.code },
        { x: 100, width: 170, text: r.title },
        { x: 270, width: 100, text: r.themeName },
        { x: 370, width: 80, text: AUDIT_RESULT_LABELS_PDF[r.result] ?? r.result, align: 'center' },
        { x: 450, width: 105, text: r.comments ?? '—' },
      ]);
    }
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica')
      .text(
        `Fix-ISO — Reporte de Auditorías — ${data.company.name} — Página ${i + 1} de ${pages.count}`,
        50, doc.page.height - 40, { width: pageWidth, align: 'center' },
      );
  }
  doc.end();
}

// ─── Implementation PDF ───────────────────────────────────────────────────────

const IMPL_STATUS_LABELS_PDF: Record<string, string> = {
  pending: 'Pendiente', in_progress: 'En progreso', implemented: 'Implementado',
  non_compliant: 'No conformidad', under_review: 'En revisión',
};

const TASK_STATUS_LABELS_PDF: Record<string, string> = {
  not_started: 'No iniciado', in_progress: 'En progreso', completed: 'Completado',
};

const MATURITY_LABELS_PDF: Record<string, string> = {
  initial: 'Inicial', managed: 'Gestionado', defined: 'Definido', measured: 'Medido', optimized: 'Optimizado',
};

export function generateImplementationPdf(data: ImplementationReportData, stream: Writable) {
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  doc.pipe(stream);
  const pageWidth = doc.page.width - 100;

  // Cover
  doc.moveDown(6);
  doc.fontSize(26).fillColor(COLORS.primary).font('Helvetica-Bold')
    .text('Reporte de Implementación', { align: 'center' });
  doc.fontSize(14).fillColor(COLORS.gray).font('Helvetica').text('ISO 27001:2022', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(20).fillColor(COLORS.text).font('Helvetica-Bold').text(data.company.name, { align: 'center' });
  doc.moveDown(1);
  doc.fontSize(11).fillColor(COLORS.gray)
    .text(`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });
  doc.moveDown(4);
  doc.save().rect(50, doc.y, pageWidth, 3).fill(COLORS.primary).restore();

  // Summary
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('1. Resumen Global');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  doc.fontSize(11).fillColor(COLORS.text).font('Helvetica')
    .text('Total de controles: ', { continued: true }).font('Helvetica-Bold').text(`${data.summary.totalControls}`);
  doc.moveDown(0.3);
  doc.fontSize(11).font('Helvetica')
    .text('Progreso global: ', { continued: true }).font('Helvetica-Bold').text(`${data.summary.progressPercentage}%`);
  doc.moveDown(1.5);

  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('2. Avance por Dominio ISO');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const domainCols = [
    { x: 50, width: 250, text: 'Dominio' },
    { x: 300, width: 80, text: 'Controles', align: 'center' },
    { x: 380, width: 80, text: 'Progreso %', align: 'center' },
  ];
  let y = drawTableRow(doc, doc.y, domainCols, { bold: true, bg: COLORS.lightGray });
  for (const d of data.byDomain) {
    if (y > 720) { doc.addPage(); y = 60; }
    y = drawTableRow(doc, y, [
      { x: 50, width: 250, text: d.themeName },
      { x: 300, width: 80, text: `${d.totalControls}`, align: 'center' },
      { x: 380, width: 80, text: `${d.progressPercentage}%`, align: 'center' },
    ]);
  }

  // Controls detail
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('3. Detalle por Control');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const controlCols = [
    { x: 50, width: 50, text: 'Código' },
    { x: 100, width: 150, text: 'Control' },
    { x: 250, width: 80, text: 'Estado', align: 'center' },
    { x: 330, width: 60, text: 'Progreso', align: 'center' },
    { x: 390, width: 70, text: 'Madurez', align: 'center' },
    { x: 460, width: 95, text: 'Responsable' },
  ];
  y = drawTableRow(doc, doc.y, controlCols, { bold: true, bg: COLORS.lightGray });
  for (const c of data.controls) {
    if (y > 720) { doc.addPage(); y = 60; }
    y = drawTableRow(doc, y, [
      { x: 50, width: 50, text: c.code },
      { x: 100, width: 150, text: c.title },
      { x: 250, width: 80, text: IMPL_STATUS_LABELS_PDF[c.status] ?? c.status, align: 'center' },
      { x: 330, width: 60, text: `${c.progressPercentage}%`, align: 'center' },
      { x: 390, width: 70, text: MATURITY_LABELS_PDF[c.maturityLevel] ?? c.maturityLevel, align: 'center' },
      { x: 460, width: 95, text: c.assignedUserName ?? '—' },
    ]);
  }

  // Dimension detail
  doc.addPage();
  doc.fontSize(18).fillColor(COLORS.primary).font('Helvetica-Bold').text('4. Estado por Dimensiones ISO');
  doc.moveDown(0.5);
  doc.save().rect(50, doc.y, pageWidth, 2).fill(COLORS.primary).restore();
  doc.moveDown(1);

  const dimCols = [
    { x: 50, width: 50, text: 'Código' },
    { x: 100, width: 130, text: 'Control' },
    { x: 230, width: 55, text: 'Política', align: 'center' },
    { x: 285, width: 60, text: 'Proced.', align: 'center' },
    { x: 345, width: 55, text: 'Técnica', align: 'center' },
    { x: 400, width: 55, text: 'Evidencia', align: 'center' },
    { x: 455, width: 48, text: 'Capac.', align: 'center' },
    { x: 503, width: 52, text: 'Monitoreo', align: 'center' },
  ];
  const dimOrder = ['policy', 'procedures', 'technical', 'evidence', 'training', 'monitoring'];
  y = drawTableRow(doc, doc.y, dimCols, { bold: true, bg: COLORS.lightGray });
  for (const c of data.controls) {
    if (y > 720) { doc.addPage(); y = 60; }
    const xs = [230, 285, 345, 400, 455, 503];
    const ws = [55, 60, 55, 55, 48, 52];
    const dimRow = dimOrder.map((key, i) => {
      const dim = c.dimensions.find(d => d.key === key);
      const status = dim?.status ?? 'not_started';
      const label = status === 'completed' ? 'OK' : status === 'in_progress' ? 'En curso' : '—';
      return { x: xs[i], width: ws[i], text: label, align: 'center' as const };
    });
    y = drawTableRow(doc, y, [
      { x: 50, width: 50, text: c.code },
      { x: 100, width: 130, text: c.title },
      ...dimRow,
    ]);
  }

  // Footer
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(COLORS.gray).font('Helvetica')
      .text(
        `Fix-ISO — Reporte de Implementación — ${data.company.name} — Página ${i + 1} de ${pages.count}`,
        50, doc.page.height - 40, { width: pageWidth, align: 'center' },
      );
  }
  doc.end();
}
