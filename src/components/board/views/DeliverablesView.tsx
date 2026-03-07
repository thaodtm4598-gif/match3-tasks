'use client';

import type { Task } from '@/types/task';
import { DELIVERABLE_RULES } from '@/lib/constants';

const FNS = [
  { key: 'design',    label: 'Design',      color: '#f0a030' },
  { key: 'narrative', label: 'Narrative',   color: '#9080f0' },
  { key: 'art',       label: 'Art',         color: '#3ecf7a' },
  { key: 'dev',       label: 'Dev',         color: '#5ba3f5' },
  { key: 'gd',        label: 'Game Design', color: '#40c0f0' },
] as const;

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 9,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  color: '#3c4870',
  fontWeight: 700,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

export default function DeliverablesView({ tasks }: { tasks: Task[] }) {
  const delivProgress = DELIVERABLE_RULES.map(d => {
    const related = tasks.filter(t => d.labels.includes(t.label));
    const done = related.filter(t => t.status === 'Done').length;
    const pct = related.length > 0 ? Math.round((done / related.length) * 100) : 0;
    return { ...d, related, done, pct };
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1a2035' }}>
            <th style={{ ...thStyle, width: 36 }}>#</th>
            <th style={{ ...thStyle, textAlign: 'left' }}>Deliverable</th>
            <th style={thStyle}>Progress</th>
            {FNS.map(f => (
              <th key={f.key} style={{ ...thStyle, color: f.color }}>
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {delivProgress.map((d, i) => {
            const color = d.pct === 100 ? '#3ecf7a' : d.pct > 0 ? '#f0a030' : '#506090';
            return (
              <tr
                key={d.id}
                style={{ borderBottom: '1px solid #141828' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0e1828')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td
                  style={{
                    padding: '8px 10px',
                    color: '#2a3a5a',
                    fontSize: 10,
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: '#3c5070', marginTop: 2 }}>
                    {d.done}/{d.related.length} tasks done
                  </div>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 6,
                        background: '#0a0d14',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${d.pct}%`,
                          background: color,
                          transition: 'width .3s',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color,
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                        width: 30,
                      }}
                    >
                      {d.pct}%
                    </span>
                  </div>
                </td>
                {FNS.map(f => (
                  <td key={f.key} style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {d.fns[f.key] ? (
                      <span style={{ color: f.color, fontSize: 14, fontWeight: 800 }}>✓</span>
                    ) : (
                      <span style={{ color: '#1a2035', fontSize: 14 }}>·</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
