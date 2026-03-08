'use client';

import type { Task, DeadlineAlert } from '@/types/task';
import { Avatar, LabelPill } from '@/components/ui';

function BotSection({
  title,
  color,
  bg,
  children,
}: {
  title: string;
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          background: bg,
          borderRadius: 6,
          padding: '5px 10px',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function BotCard({ alert: a }: { alert: DeadlineAlert }) {
  const { task: t, type, days } = a;
  const label =
    type === 'overdue'
      ? `${days}d overdue`
      : type === 'today'
        ? 'Due today!'
        : `Due in ${days}d`;
  const color =
    type === 'overdue' ? '#f05060' : type === 'today' ? '#f0a030' : '#f0d040';

  return (
    <div
      style={{
        background: 'var(--th-surface)',
        border: '1px solid var(--th-border2)',
        borderRadius: 6,
        padding: '8px 10px',
        marginBottom: 6,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--th-text3)', marginBottom: 3 }}>
        {t.id}
      </div>
      <div style={{ fontSize: 11, color: 'var(--th-text)', marginBottom: 5 }}>
        {t.summary}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Avatar name={t.assignee} />
          <LabelPill label={t.label} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
      </div>
    </div>
  );
}

interface Props {
  alerts: DeadlineAlert[];
  tasks: Task[];
  onClose: () => void;
}

export default function BotPanel({ alerts, tasks, onClose }: Props) {
  const overdue = alerts.filter((a) => a.type === 'overdue');
  const today = alerts.filter((a) => a.type === 'today');
  const soon = alerts.filter((a) => a.type === 'soon');

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 340,
        background: 'var(--th-surface)',
        borderLeft: '1px solid var(--th-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        boxShadow: '-8px 0 30px rgba(0,0,0,.5)',
        animation: 'slideIn .2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--th-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 18 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 13, fontWeight: 800, color: 'var(--th-text)' }}
          >
            Reminder Bot
          </div>
          <div style={{ fontSize: 10, color: 'var(--th-text3)' }}>
            {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--th-text2)',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {alerts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--th-text3)',
              padding: '40px 20px',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--th-text2)',
              }}
            >
              Tất cả task đều on track!
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--th-text3)', marginTop: 6 }}
            >
              Không có deadline cần nhắc hôm nay.
            </div>
          </div>
        ) : (
          <>
            {overdue.length > 0 && (
              <BotSection title="🚨 Overdue" color="#f05060" bg="#1a0808">
                {overdue.map((a) => (
                  <BotCard key={a.task.id} alert={a} />
                ))}
              </BotSection>
            )}
            {today.length > 0 && (
              <BotSection title="🔔 Due Today" color="#f0a030" bg="#1a0f00">
                {today.map((a) => (
                  <BotCard key={a.task.id} alert={a} />
                ))}
              </BotSection>
            )}
            {soon.length > 0 && (
              <BotSection
                title="⚡ Due Soon (≤2 days)"
                color="#f0d040"
                bg="#181400"
              >
                {soon.map((a) => (
                  <BotCard key={a.task.id} alert={a} />
                ))}
              </BotSection>
            )}
          </>
        )}

        {/* Summary */}
        <div
          style={{
            marginTop: 16,
            background: 'var(--th-surface2)',
            border: '1px solid var(--th-border)',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 8,
              color: 'var(--th-text2)',
            }}
          >
            📊 Today&#39;s Summary
          </div>
          {[
            {
              label: 'Total tasks',
              val: tasks.length,
              color: 'var(--th-text2)',
            },
            {
              label: 'Done',
              val: tasks.filter((t) => t.status === 'Done').length,
              color: '#3ecf7a',
            },
            {
              label: 'In Progress',
              val: tasks.filter((t) => t.status === 'In Progress').length,
              color: '#f0a030',
            },
            { label: 'Overdue', val: overdue.length, color: '#f05060' },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 0',
                borderBottom: '1px solid var(--th-border2)',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--th-text3)' }}>
                {r.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>
                {r.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
