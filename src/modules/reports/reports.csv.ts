import type { TrainingsReportData, AuditsReportData, ImplementationReportData } from './reports.service';

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map(row => row.map(escapeCsvField).join(',')).join('\r\n');
}

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

const AUDIT_STATUS_LABELS: Record<string, string> = {
  planned: 'Planificada',
  in_progress: 'En progreso',
  completed: 'Completada',
};

const AUDIT_RESULT_LABELS: Record<string, string> = {
  compliant: 'Conforme',
  non_compliant: 'No conforme',
  not_evaluated: 'No evaluado',
};

const IMPL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  implemented: 'Implementado',
  non_compliant: 'No conformidad',
  under_review: 'En revisión',
};

const TASK_STATUS_LABELS: Record<string, string> = {
  not_started: 'No iniciado',
  in_progress: 'En progreso',
  completed: 'Completado',
};

const MATURITY_LABELS: Record<string, string> = {
  initial: 'Inicial',
  managed: 'Gestionado',
  defined: 'Definido',
  measured: 'Medido',
  optimized: 'Optimizado',
};

export function generateTrainingsCsv(data: TrainingsReportData): string {
  const rows: (string | number | null | undefined)[][] = [];

  rows.push([`Reporte de Capacitaciones — ${data.company.name}`]);
  rows.push([`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO')}`]);
  rows.push([]);

  // Summary table
  rows.push(['Título', 'Tipo', 'Fecha Asignación', 'Asignado por', 'Total Inscritos', 'Completados', '% Completado']);
  for (const item of data.items) {
    const pct = item.totalEnrolled > 0 ? Math.round((item.totalCompleted / item.totalEnrolled) * 100) : 0;
    rows.push([
      item.title,
      TRAINING_TYPE_LABELS[item.trainingType] ?? item.trainingType,
      item.assignedAt,
      item.assignedByName,
      item.totalEnrolled,
      item.totalCompleted,
      `${pct}%`,
    ]);
  }

  rows.push([]);
  rows.push(['--- DETALLE DE INSCRIPCIONES ---']);
  rows.push(['Capacitación', 'Participante', 'Email', 'Estado', 'Inscrito el', 'Completado el']);
  for (const item of data.items) {
    for (const e of item.enrollments) {
      rows.push([
        item.title,
        e.userName,
        e.userEmail,
        ENROLLMENT_STATUS_LABELS[e.status] ?? e.status,
        e.enrolledAt,
        e.completedAt ?? '—',
      ]);
    }
  }

  return buildCsv(rows);
}

export function generateAuditsCsv(data: AuditsReportData): string {
  const rows: (string | number | null | undefined)[][] = [];

  rows.push([`Reporte de Auditorías — ${data.company.name}`]);
  rows.push([`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO')}`]);
  rows.push([]);

  // Summary table
  rows.push(['ID', 'Fecha', 'Auditor', 'Estado', 'Total Controles', 'Conformes', 'No Conformes', 'No Evaluados', 'Notas']);
  for (const a of data.audits) {
    rows.push([
      a.id,
      a.date,
      a.auditorName,
      AUDIT_STATUS_LABELS[a.status] ?? a.status,
      a.totalControls,
      a.compliant,
      a.nonCompliant,
      a.notEvaluated,
      a.notes ?? '—',
    ]);
  }

  rows.push([]);
  rows.push(['--- DETALLE DE RESULTADOS POR CONTROL ---']);
  rows.push(['ID Auditoría', 'Fecha Auditoría', 'Auditor', 'Código', 'Control', 'Dominio', 'Resultado', 'Comentarios']);
  for (const a of data.audits) {
    for (const r of a.results) {
      rows.push([
        a.id,
        a.date,
        a.auditorName,
        r.code,
        r.title,
        r.themeName,
        AUDIT_RESULT_LABELS[r.result] ?? r.result,
        r.comments ?? '—',
      ]);
    }
  }

  return buildCsv(rows);
}

export function generateImplementationCsv(data: ImplementationReportData): string {
  const rows: (string | number | null | undefined)[][] = [];

  rows.push([`Reporte de Implementación ISO 27001 — ${data.company.name}`]);
  rows.push([`Generado: ${new Date(data.generatedAt).toLocaleDateString('es-CO')}`]);
  rows.push([`Progreso global: ${data.summary.progressPercentage}% (${data.summary.totalControls} controles)`]);
  rows.push([]);

  // Domain summary
  rows.push(['--- RESUMEN POR DOMINIO ---']);
  rows.push(['Dominio', 'Controles', 'Progreso %']);
  for (const d of data.byDomain) {
    rows.push([d.themeName, d.totalControls, `${d.progressPercentage}%`]);
  }

  rows.push([]);
  rows.push(['--- DETALLE POR CONTROL ---']);
  rows.push([
    'Código', 'Control', 'Dominio', 'Estado', 'Madurez', 'Progreso %', 'Responsable',
    'Política', 'Procedimientos', 'Impl. Técnica', 'Evidencia', 'Capacitación', 'Monitoreo',
  ]);

  const dimOrder = ['policy', 'procedures', 'technical', 'evidence', 'training', 'monitoring'];

  for (const c of data.controls) {
    const dimStatuses = dimOrder.map(key => {
      const dim = c.dimensions.find(d => d.key === key);
      return TASK_STATUS_LABELS[dim?.status ?? 'not_started'] ?? '—';
    });

    rows.push([
      c.code,
      c.title,
      c.themeName,
      IMPL_STATUS_LABELS[c.status] ?? c.status,
      MATURITY_LABELS[c.maturityLevel] ?? c.maturityLevel,
      `${c.progressPercentage}%`,
      c.assignedUserName ?? '—',
      ...dimStatuses,
    ]);
  }

  return buildCsv(rows);
}
