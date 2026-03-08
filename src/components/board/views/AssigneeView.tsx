'use client';

import type { Task } from '@/types/task';
import { daysUntil, fmt } from '@/lib/helpers';
import { PriorityDot, StatusBadge, Avatar } from '@/components/ui';

interface Props {
  tasks: Task[];
  onCycle: (id: string) => void;
  onDone: (id: string) => void;
}

export default function AssigneeView({ tasks, onCycle, onDone }: Props) {
  const grouped: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    const key = t.assignee || 'Unassigned';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))',
        gap: 16,
      }}
    >
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([person, ptasks]) => {
          const done = ptasks.filter((t) => t.status === 'Done').length;
          const pct = Math.round((done / ptasks.length) * 100);
          const hue =
            person.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

          return (
            <div
              key={person}
              style={{
                background: 'var(--th-card)',
                border: '1px solid var(--th-border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  background: `var(--th-surface2)`,
                  borderBottom: `1px solid hsl(${hue},40%,40%)44`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Avatar name={person} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: 'var(--th-text)',
                    }}
                  >
                    {person}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--th-text3)' }}>
                    {ptasks.length} tasks · {done} done
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: `hsl(${hue},60%,55%)`,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, background: 'var(--th-surface)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: `hsl(${hue},60%,45%)`,
                    transition: 'width .3s',
                  }}
                />
              </div>

              <div style={{ padding: 8 }}>
                {ptasks.map((t) => {
                  const d = daysUntil(t.end_date);
                  const urgent = d !== null && d <= 1 && t.status !== 'Done';
                  return (
                    <div
                      key={t.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 6,
                        marginBottom: 2,
                        background: urgent
                          ? 'rgba(240,80,96,0.1)'
                          : 'transparent',
                        border: `1px solid ${urgent ? 'rgba(240,80,96,0.25)' : 'transparent'}`,
                      }}
                    >
                      <PriorityDot priority={t.priority} />
                      <div
                        style={{
                          flex: 1,
                          fontSize: 11,
                          color: 'var(--th-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          opacity: t.status === 'Done' ? 0.5 : 1,
                        }}
                      >
                        {t.summary}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            d !== null && d < 0
                              ? '#f05060'
                              : d === 0
                                ? '#f0a030'
                                : 'var(--th-text3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmt(t.end_date)}
                      </span>
                      <StatusBadge
                        status={t.status}
                        onClick={() => onCycle(t.id)}
                      />
                      {t.status !== 'Done' && (
                        <button
                          onClick={() => onDone(t.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #1a3a20',
                            borderRadius: 3,
                            color: '#2a6040',
                            cursor: 'pointer',
                            padding: '1px 5px',
                            fontSize: 10,
                          }}
                        >
                          ✓
                        </button>
                      )}
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
