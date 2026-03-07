import type { Task, DeadlineAlert } from '@/types/task';
import { WORKFLOW_RULES, DELIVERABLE_RULES } from './constants';

export function genId(): string {
  return 'M3-' + String(Math.floor(Math.random() * 9000) + 1000);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Display date without the year prefix (e.g. "2026-03-09" → "03-09") */
export function fmt(d: string | null | undefined): string {
  if (!d) return '—';
  return d.replace(/^\d{4}-/, '');
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = (new Date(dateStr).getTime() - new Date(today()).getTime()) / 86400000;
  return Math.round(diff);
}

export function inferWorkflow(label: string): string | null {
  for (const wf of WORKFLOW_RULES) {
    if (wf.labels.includes(label)) return wf.id;
  }
  return null;
}

export function inferDeliverables(label: string): string[] {
  return DELIVERABLE_RULES.filter(d => d.labels.includes(label)).map(d => d.id);
}

export function getDeadlineAlerts(tasks: Task[]): DeadlineAlert[] {
  const alerts: DeadlineAlert[] = [];
  tasks.forEach(t => {
    if (t.status === 'Done') return;
    const d = daysUntil(t.end_date);
    if (d === null) return;
    if (d < 0)      alerts.push({ task: t, type: 'overdue', days: Math.abs(d) });
    else if (d === 0) alerts.push({ task: t, type: 'today',   days: 0 });
    else if (d <= 2)  alerts.push({ task: t, type: 'soon',    days: d });
  });
  return alerts.sort((a, b) => a.days - b.days);
}
