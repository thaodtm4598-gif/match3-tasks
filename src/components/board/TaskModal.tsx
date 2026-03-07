'use client';

import { useState } from 'react';
import type { Task, TaskStatus, TaskPriority, TaskSprint } from '@/types/task';
import { ALL_LABELS, MEMBERS, STATUS_OPTS, PRIORITY_OPTS, SPRINT_OPTS, WORKFLOW_RULES, DELIVERABLE_RULES } from '@/lib/constants';
import { inferWorkflow, inferDeliverables } from '@/lib/helpers';
import { Btn, Field, inputStyle } from '@/components/ui';

type FormData = Omit<Task, 'created_at' | 'updated_at'>;

interface Props {
  initial: Task | null;
  onSave: (data: FormData) => void;
  onClose: () => void;
}

export default function TaskModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormData>(
    initial ?? {
      id: '',
      summary: '',
      label: 'Core Game',
      status: 'To Do' as TaskStatus,
      priority: 'Medium' as TaskPriority,
      assignee: '',
      start_date: '',
      end_date: '',
      sprint: 'Sprint 1' as TaskSprint,
      note: '',
    },
  );

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const wfId = inferWorkflow(form.label);
  const wfName = wfId ? WORKFLOW_RULES.find(w => w.id === wfId)?.name : null;
  const delivs = inferDeliverables(form.label);

  function handleSave() {
    if (!form.summary.trim()) {
      alert('Summary is required');
      return;
    }
    onSave(form);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        animation: 'fadeIn .15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0e1220',
          border: '1px solid #1a2035',
          borderRadius: 12,
          padding: '24px',
          width: 540,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,.7)',
          animation: 'slideIn .2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800 }}>
            {initial?.id ? `Edit ${initial.id}` : 'Add New Task'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#506090', cursor: 'pointer', fontSize: 18 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Summary */}
          <Field label="Summary *">
            <input
              value={form.summary}
              onChange={e => set('summary', e.target.value)}
              placeholder="Describe the task…"
              style={inputStyle}
            />
          </Field>

          {/* Grid fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Label / Epic">
              <select
                value={form.label}
                onChange={e => set('label', e.target.value)}
                style={inputStyle}
              >
                {ALL_LABELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>

            <Field label="Assignee">
              <select
                value={form.assignee}
                onChange={e => set('assignee', e.target.value)}
                style={inputStyle}
              >
                <option value="">— Select —</option>
                {MEMBERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as TaskStatus)}
                style={inputStyle}
              >
                {STATUS_OPTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value as TaskPriority)}
                style={inputStyle}
              >
                {PRIORITY_OPTS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            <Field label="Start Date">
              <input
                type="date"
                value={form.start_date ?? ''}
                onChange={e => set('start_date', e.target.value || null)}
                style={inputStyle}
              />
            </Field>

            <Field label="Due Date">
              <input
                type="date"
                value={form.end_date ?? ''}
                onChange={e => set('end_date', e.target.value || null)}
                style={inputStyle}
              />
            </Field>

            <Field label="Sprint">
              <select
                value={form.sprint}
                onChange={e => set('sprint', e.target.value as TaskSprint)}
                style={inputStyle}
              >
                {SPRINT_OPTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Note */}
          <Field label="Note">
            <input
              value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Optional note / blocker…"
              style={inputStyle}
            />
          </Field>

          {/* Auto-routing preview */}
          {(wfName || delivs.length > 0) && (
            <div
              style={{
                background: '#07101a',
                border: '1px solid #0f2a3a',
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#4a90c0',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                ⚡ Auto-routing preview
              </div>
              {wfName && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#3c5070' }}>Workflow chain: </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#5ba3f5' }}>{wfName}</span>
                </div>
              )}
              {delivs.length > 0 && (
                <div>
                  <span style={{ fontSize: 10, color: '#3c5070' }}>Linked deliverables: </span>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {delivs.map(did => {
                      const d = DELIVERABLE_RULES.find(x => x.id === did);
                      return d ? (
                        <span
                          key={did}
                          style={{
                            fontSize: 9,
                            background: '#0a1828',
                            border: '1px solid #1a3050',
                            borderRadius: 3,
                            padding: '2px 6px',
                            color: '#5070a0',
                          }}
                        >
                          {d.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn primary onClick={handleSave}>
              {initial?.id ? 'Save Changes' : 'Add Task →'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
