import { env } from '../../config/env';

const BIGDATA_BASE = env.BIGDATA_API_URL;
const TIMEOUT_MS = 15_000;

async function bigdataFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BIGDATA_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BigData API ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const bigdataService = {
  getThreatMap: () => bigdataFetch<unknown>('/api/analytics/threat-map'),
  getThreatTimeline: () => bigdataFetch<unknown>('/api/analytics/threat-timeline'),
  getMitreIsoCorrelation: (companyId: number) =>
    bigdataFetch<unknown>(`/api/analytics/mitre-iso-correlation?company_id=${companyId}`),
  getCompanyRiskScore: (companyId: number) =>
    bigdataFetch<unknown>(`/api/analytics/company-risk-score?company_id=${companyId}`),
  runPipeline: () =>
    bigdataFetch<unknown>('/api/analytics/run-pipeline', { method: 'POST' }),
  health: () => bigdataFetch<{ status: string; data_available: boolean }>('/api/analytics/health'),
};
