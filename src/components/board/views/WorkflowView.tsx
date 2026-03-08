'use client';

import type { Task } from '@/types/task';
import { WORKFLOW_RULES, LABEL_META } from '@/lib/constants';
import { inferWorkflow, fmt } from '@/lib/helpers';
import { LabelPill, StatusBadge, Avatar } from '@/components/ui';

export default function WorkflowView({ tasks }: { tasks: Task[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {WORKFLOW_RULES.map((wf) => {
        const wfTasks = tasks.filter((t) => inferWorkflow(t.label) === wf.id);
        if (wfTasks.length === 0) return null;
        const done = wfTasks.filter((t) => t.status === 'Done').length;
        const pct = Math.round((done / wfTasks.length) * 100);

        return (
          <div
            key={wf.id}
            style={{
              background: 'var(--th-card)',
              border: '1px solid var(--th-border)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                background: 'var(--th-surface)',
                borderBottom: '1px solid var(--th-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: 'var(--th-text)',
                  }}
                >
                  {wf.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--th-text3)',
                    marginTop: 2,
                  }}
                >
                  {wfTasks.length} tasks · {done} done · {pct}% complete
                </div>
              </div>
              <div
                style={{
                  height: 6,
                  width: 120,
                  background: 'var(--th-surface2)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: '#3ecf7a',
                    transition: 'width .3s',
                  }}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#3ecf7a' }}>
                {pct}%
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '16px 20px',
                gap: 0,
              }}
            >
              {wf.labels.map((l, li) => {
                const ltasks = tasks.filter(
                  (t) => t.label === l && inferWorkflow(t.label) === wf.id,
                );
                if (ltasks.length === 0) return null;
                const m = LABEL_META[l] ?? {};

                return (
                  <div
                    key={l}
                    style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}
                  >
                    {li > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 12px',
                          color: 'var(--th-text3)',
                          fontSize: 20,
                        }}
                      >
                        →
                      </div>
                    )}
                    <div style={{ minWidth: 220, maxWidth: 280, flex: 1 }}>
                      <div
                        style={{
                          background: m.bg ?? 'var(--th-surface2)',
                          border: `1px solid ${(m.dot ?? '#2a3a5a') + '44'}`,
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            borderBottom: `1px solid ${(m.dot ?? '#2a3a5a') + '33'}`,
                          }}
                        >
                          <LabelPill label={l} />
                        </div>
                        <div
                          style={{
                            padding: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}
                        >
                          {ltasks.map((t) => (
                            <div
                              key={t.id}
                              style={{
                                background: 'var(--th-surface)',
                                border: '1px solid var(--th-border2)',
                                borderRadius: 6,
                                padding: '8px 10px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 11,
                                  color: 'var(--th-text)',
                                  marginBottom: 5,
                                  lineHeight: 1.4,
                                }}
                              >
                                {t.summary}
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 6,
                                    alignItems: 'center',
                                  }}
                                >
                                  <Avatar name={t.assignee} />
                                  <span
                                    style={{
                                      fontSize: 9,
                                      color: 'var(--th-text3)',
                                    }}
                                  >
                                    {fmt(t.end_date)}
                                  </span>
                                </div>
                                <StatusBadge status={t.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
