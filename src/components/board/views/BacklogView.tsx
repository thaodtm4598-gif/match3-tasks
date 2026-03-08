'use client';

import type { Task } from '@/types/task';
import { WORKFLOW_RULES } from '@/lib/constants';
import { daysUntil, fmt, inferWorkflow } from '@/lib/helpers';
import {
  LabelPill,
  StatusBadge,
  PriorityDot,
  Avatar,
  EmptyState,
} from '@/components/ui';

interface Props {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onCycle: (id: string) => void;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: 'var(--th-text3)' as string,
  whiteSpace: 'nowrap',
  fontWeight: 700,
};

export default function BacklogView({
  tasks,
  onEdit,
  onCycle,
  onDone,
  onDelete,
}: Props) {
  return (
    <div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--th-border)' }}>
            {[
              'Key',
              'Summary',
              'Label',
              'Status',
              'Priority',
              'Assignee',
              'Start',
              'Due',
              'Build',
              'Workflow',
              '✓',
              '🗑',
            ].map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t, i) => {
            const d = daysUntil(t.end_date);
            const overdue = d !== null && d < 0 && t.status !== 'Done';
            const dueToday = d === 0 && t.status !== 'Done';
            const rowBg =
              t.status === 'Done'
                ? 'var(--th-surface)'
                : i % 2 === 0
                  ? 'transparent'
                  : 'var(--th-surface2)';
            const wfId = inferWorkflow(t.label);
            const wfName = wfId
              ? WORKFLOW_RULES.find((w) => w.id === wfId)
                  ?.name.split(' ')
                  .slice(0, 2)
                  .join(' ')
              : null;

            return (
              <tr
                key={t.id}
                style={{
                  background: rowBg,
                  borderBottom: '1px solid transparent',
                  opacity: t.status === 'Done' ? 0.5 : 1,
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--th-surface2)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
              >
                <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                  <button
                    onClick={() => onEdit(t)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--th-accent2)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 11,
                      padding: 0,
                    }}
                  >
                    {t.id}
                  </button>
                </td>
                <td
                  style={{
                    padding: '7px 10px',
                    maxWidth: 300,
                    color: 'var(--th-text)',
                    wordBreak: 'break-word',
                    lineHeight: 1.4,
                  }}
                >
                  {t.summary}
                  {t.note && (
                    <span
                      style={{
                        marginLeft: 6,
                        color: 'var(--th-text3)',
                        fontSize: 10,
                      }}
                    >
                      📝
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <LabelPill label={t.label} />
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <StatusBadge
                    status={t.status}
                    onClick={() => onCycle(t.id)}
                  />
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                  <PriorityDot priority={t.priority} />
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <Avatar name={t.assignee} />
                </td>
                <td
                  style={{
                    padding: '7px 8px',
                    color: 'var(--th-text3)',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmt(t.start_date)}
                </td>
                <td style={{ padding: '7px 8px', whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: overdue
                        ? '#f05060'
                        : dueToday
                          ? '#f0a030'
                          : 'var(--th-text3)',
                      fontWeight: overdue || dueToday ? 700 : 400,
                    }}
                  >
                    {fmt(t.end_date)}
                    {overdue && ' ⚠️'}
                    {dueToday && ' 🔔'}
                  </span>
                </td>
                <td
                  style={{
                    padding: '7px 8px',
                    color: 'var(--th-text3)',
                    fontSize: 10,
                  }}
                >
                  {t.sprint}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  {wfName && (
                    <span
                      style={{
                        fontSize: 9,
                        color: 'var(--th-text2)',
                        background: 'var(--th-surface2)',
                        border: '1px solid var(--th-border)',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}
                    >
                      {wfName}
                    </span>
                  )}
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                  {t.status !== 'Done' ? (
                    <button
                      onClick={() => onDone(t.id)}
                      title="Mark Done"
                      style={{
                        background: 'none',
                        border: '1px solid #1a3a20',
                        borderRadius: 4,
                        color: '#2a6040',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontSize: 11,
                      }}
                    >
                      ✓
                    </button>
                  ) : (
                    <span style={{ color: '#2a6040', fontSize: 14 }}>✓</span>
                  )}
                </td>
                <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                  <button
                    onClick={() => onDelete(t.id)}
                    title="Delete"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--th-text3)',
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: '2px 4px',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = '#f05060')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = 'var(--th-text3)')
                    }
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tasks.length === 0 && (
        <EmptyState msg="No tasks match the current filters." />
      )}
    </div>
  );
}
