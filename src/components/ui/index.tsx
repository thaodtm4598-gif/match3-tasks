'use client';

import { LABEL_META, STATUS_STYLE, PRIORITY_STYLE } from '@/lib/constants';

// ─── LabelPill ────────────────────────────────────────────────────────────────
export function LabelPill({ label, size = 'sm' }: { label: string; size?: 'sm' | 'md' }) {
  const m = LABEL_META[label] ?? { bg: '#1a1e2a', fg: '#8090b0', dot: '#5060a0' };
  const pad = size === 'sm' ? '2px 8px' : '3px 10px';
  const fs = size === 'sm' ? 10 : 11;
  return (
    <span
      style={{
        background: m.bg,
        color: m.fg,
        border: `1px solid ${m.dot}44`,
        borderRadius: 4,
        padding: pad,
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: '.3px',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }}
      />
      {label}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE['Open'];
  return (
    <span
      onClick={onClick}
      style={{
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 700,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── PriorityDot ──────────────────────────────────────────────────────────────
export function PriorityDot({ priority }: { priority: string }) {
  const p = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE['Medium'];
  return (
    <span style={{ fontSize: 12 }} title={priority}>
      {p.icon}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name }: { name: string }) {
  if (!name) return <span style={{ color: '#3c4260', fontSize: 11 }}>—</span>;
  const initials = name.replace(/[^A-Za-z\u00C0-\u1EF9]/g, '').slice(0, 2).toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: `hsl(${hue},45%,25%)`,
        border: `1.5px solid hsl(${hue},55%,40%)`,
        color: `hsl(${hue},70%,70%)`,
        fontSize: 9,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={name}
    >
      {initials}
    </span>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  onClick,
  primary,
  style,
  type = 'button',
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 14px',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        background: primary ? '#1a4a8a' : '#0e1220',
        border: `1px solid ${primary ? '#2a6acc' : '#1a2035'}`,
        color: primary ? '#80b8f8' : '#506090',
        transition: 'all .15s',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
export function Tab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        background: 'none',
        border: 'none',
        borderBottom: `2px solid ${active ? '#4a90d9' : 'transparent'}`,
        color: active ? '#4a90d9' : '#3c5070',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ─── FSelect ──────────────────────────────────────────────────────────────────
export function FSelect({
  value,
  onChange,
  opts,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: string[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#0e1220',
        border: '1px solid #1a2035',
        borderRadius: 6,
        padding: '5px 10px',
        color: value !== 'all' ? '#dde3f0' : '#506090',
        fontSize: 11,
        fontFamily: 'inherit',
        outline: 'none',
      }}
    >
      <option value="all">All {label}</option>
      {opts.filter(o => o !== 'all').map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          color: '#3c5070',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#2a3a5a' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 13 }}>{msg}</div>
    </div>
  );
}

// ─── inputStyle (shared) ──────────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#090b12',
  border: '1px solid #1a2035',
  borderRadius: 6,
  padding: '7px 10px',
  color: '#dde3f0',
  fontSize: 12,
  fontFamily: 'inherit',
  outline: 'none',
};
