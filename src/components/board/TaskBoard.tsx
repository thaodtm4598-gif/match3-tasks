'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types/task';
import { STATUS_OPTS, MEMBERS, ALL_LABELS } from '@/lib/constants';
import { genId, getDeadlineAlerts } from '@/lib/helpers';
import { FSelect } from '@/components/ui';
import {
  loadTheme,
  saveTheme,
  nextTheme,
  getTheme,
  type ThemeId,
} from '@/lib/theme';
import KanbanView from './views/KanbanView';
import BacklogView from './views/BacklogView';
import AssigneeView from './views/AssigneeView';
import WorkflowView from './views/WorkflowView';
import DeliverablesView from './views/DeliverablesView';
import TaskModal from './TaskModal';
import BotPanel from './BotPanel';

type TabId = 'kanban' | 'backlog' | 'assignee' | 'workflow' | 'deliverables';
interface Toast {
  msg: string;
  type: 'success' | 'error';
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'kanban', label: 'Kanban', icon: '◈' },
  { id: 'backlog', label: 'List', icon: '≡' },
  { id: 'assignee', label: 'Team', icon: '◉' },
  { id: 'workflow', label: 'Flows', icon: '⟶' },
  { id: 'deliverables', label: 'Deliver', icon: '◆' },
];

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

/** Sort undone tasks first (by priority → deadline), Done last */
function sortUndoneFirst(tasks: Task[]): Task[] {
  const undone = tasks.filter((t) => t.status !== 'Done');
  const done = tasks.filter((t) => t.status === 'Done');
  undone.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.end_date && b.end_date) return a.end_date.localeCompare(b.end_date);
    if (a.end_date) return -1;
    if (b.end_date) return 1;
    return 0;
  });
  return [...undone, ...done];
}

// ── GemKpi ────────────────────────────────────────────────────────────────────
function GemKpi({
  n,
  label,
  color,
}: {
  n: number;
  label: string;
  color: string;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '6px 12px',
        background: color + '12',
        border: `1px solid ${color}30`,
        borderRadius: 8,
        minWidth: 56,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 9,
          color: color + 'aa',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ── ModeTab ───────────────────────────────────────────────────────────────────
function ModeTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        background: active ? 'var(--th-accent)22' : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--th-accent)' : 'transparent'}`,
        color: active ? 'var(--th-accent2)' : 'var(--th-text3)',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--th-text2)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--th-text3)';
      }}
    >
      <span
        style={{ fontSize: active ? 14 : 12, transition: 'font-size .15s' }}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

// ── ThemeBtn ──────────────────────────────────────────────────────────────────
function ThemeBtn({
  themeId,
  onCycle,
}: {
  themeId: ThemeId;
  onCycle: () => void;
}) {
  const theme = getTheme(themeId);
  return (
    <button
      onClick={onCycle}
      title={`Theme: ${theme.label} — click to switch`}
      style={{
        padding: '5px 10px',
        background: 'var(--th-surface)',
        border: '1px solid var(--th-border)',
        borderRadius: 8,
        color: 'var(--th-text2)',
        fontSize: 11,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        transition: 'all .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--th-accent2)';
        e.currentTarget.style.color = 'var(--th-text)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--th-border)';
        e.currentTarget.style.color = 'var(--th-text2)';
      }}
      aria-label={`Switch theme, current: ${theme.label}`}
    >
      <span style={{ fontSize: 13 }}>{theme.icon}</span>
      <span>{theme.label}</span>
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  initialTasks: Task[];
  userEmail: string;
}

export default function TaskBoard({ initialTasks, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [themeId, setThemeId] = useState<ThemeId>('dark');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<TabId>('kanban');
  const [filterStatus, setFS] = useState('all');
  const [filterLabel, setFL] = useState('all');
  const [filterMember, setFM] = useState('all');
  const [searchQ, setSearch] = useState('');
  const [showAddModal, setAddModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('To Do');
  const [showBot, setShowBot] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // ── Load theme from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    setThemeId(loadTheme());
  }, []);

  function cycleTheme() {
    const next = nextTheme(themeId);
    setThemeId(next);
    saveTheme(next);
  }

  // ── Realtime ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) =>
              prev.find((t) => t.id === (payload.new as Task).id)
                ? prev
                : [payload.new as Task, ...prev],
            );
          } else if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Task).id ? (payload.new as Task) : t,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) =>
              prev.filter((t) => t.id !== (payload.old as { id: string }).id),
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast ────────────────────────────────────────────────────────────────────
  function showToast(msg: string, type: Toast['type'] = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = tasks.filter((t) => {
    if (filterLabel !== 'all' && t.label !== filterLabel) return false;
    if (filterMember !== 'all' && t.assignee !== filterMember) return false;
    if (
      searchQ &&
      !t.summary.toLowerCase().includes(searchQ.toLowerCase()) &&
      !t.id.toLowerCase().includes(searchQ.toLowerCase())
    )
      return false;
    return true;
  });

  const visibleWithStatus = filtered.filter(
    (t) => filterStatus === 'all' || t.status === filterStatus,
  );

  const sorted = sortUndoneFirst(filtered);
  const sortedWithStatus = sortUndoneFirst(visibleWithStatus);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const handleSaveTask = useCallback(
    async (data: Omit<Task, 'created_at' | 'updated_at'>) => {
      setSaving(true);
      const isEdit = !!(data.id && tasks.find((t) => t.id === data.id));
      if (isEdit) {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)),
        );
        const { error } = await supabase
          .from('tasks')
          .update(data)
          .eq('id', data.id);
        if (error) showToast('Error: ' + error.message, 'error');
        else showToast(`Saved ${data.id}`);
      } else {
        const newTask = { ...data, id: genId() };
        setTasks((prev) => [newTask, ...prev]);
        const { error } = await supabase.from('tasks').insert(newTask);
        if (error) {
          setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
          showToast('Error: ' + error.message, 'error');
        } else showToast(`Task added to ${data.assignee || 'team'}`);
      }
      setSaving(false);
      setAddModal(false);
      setEditTask(null);
    },
    [tasks, supabase],
  );

  const changeStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      await supabase.from('tasks').update({ status }).eq('id', id);
    },
    [supabase],
  );

  const cycleStatus = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const idx = STATUS_OPTS.indexOf(
        task.status as (typeof STATUS_OPTS)[number],
      );
      const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length] as TaskStatus;
      changeStatus(id, next);
    },
    [tasks, changeStatus],
  );

  const markDone = useCallback(
    async (id: string) => {
      changeStatus(id, 'Done');
      showToast('Task done!');
    },
    [changeStatus],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!confirm('Delete this task?')) return;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await supabase.from('tasks').delete().eq('id', id);
      showToast('Deleted', 'error');
    },
    [supabase],
  );

  function openAddModal(status: TaskStatus = 'To Do') {
    setDefaultStatus(status);
    setEditTask(null);
    setAddModal(true);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const alerts = getDeadlineAlerts(tasks);
  const kpi = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'Done').length,
    wip: tasks.filter((t) => t.status === 'In Progress').length,
    todo: tasks.filter((t) => t.status === 'To Do' || t.status === 'Open')
      .length,
    alert: alerts.length,
  };

  const hasFilter =
    filterStatus !== 'all' ||
    filterLabel !== 'all' ||
    filterMember !== 'all' ||
    !!searchQ;
  const showFilterBar =
    activeTab === 'backlog' ||
    activeTab === 'assignee' ||
    activeTab === 'kanban';

  // ── Theme vars ───────────────────────────────────────────────────────────────
  const themeVars = getTheme(themeId).vars as React.CSSProperties;

  return (
    <div
      data-theme={themeId}
      style={{
        ...themeVars,
        background: 'var(--th-bg)',
        color: 'var(--th-text)',
        fontFamily: "'DM Sans',system-ui,sans-serif",
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--th-header)',
          borderBottom: '1px solid var(--th-border)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {/* Branding */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: '-.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              style={{
                background:
                  'linear-gradient(135deg,var(--th-accent),var(--th-accent2))',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '.5px',
              }}
            >
              M3
            </span>
            <span style={{ color: 'var(--th-text)' }}>Task Board</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--th-text3)',
                background: 'var(--th-surface)',
                border: '1px solid var(--th-border)',
                borderRadius: 4,
                padding: '1px 6px',
                marginLeft: 2,
              }}
            >
              Build 1.2
            </span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--th-text3)', marginTop: 2 }}>
            Build Mar 2026
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <GemKpi n={kpi.total} label="Total" color="#7090c0" />
          <GemKpi n={kpi.done} label="Done" color="#059669" />
          <GemKpi n={kpi.wip} label="Active" color="#D97706" />
          <GemKpi n={kpi.todo} label="Pending" color="var(--th-accent)" />
          {kpi.alert > 0 && (
            <GemKpi n={kpi.alert} label="Alerts" color="#F43F5E" />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Theme switcher */}
          <ThemeBtn themeId={themeId} onCycle={cycleTheme} />

          {/* Bot */}
          <button
            onClick={() => setShowBot(!showBot)}
            style={{
              position: 'relative',
              padding: '7px 14px',
              background: alerts.length > 0 ? '#2a0a1a' : 'var(--th-surface)',
              border: `1px solid ${alerts.length > 0 ? '#F43F5E60' : 'var(--th-border)'}`,
              borderRadius: 8,
              color: alerts.length > 0 ? '#F87171' : 'var(--th-text2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = 'var(--th-accent)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor =
                alerts.length > 0 ? '#F43F5E60' : 'var(--th-border)')
            }
            aria-label="Open reminder bot"
          >
            Bot
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  background: '#F43F5E',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                }}
              >
                {alerts.length}
              </span>
            )}
          </button>

          {/* Add task */}
          <button
            onClick={() => openAddModal('To Do')}
            style={{
              padding: '7px 16px',
              background:
                'linear-gradient(135deg,var(--th-accent),var(--th-accent)cc)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '.3px',
              boxShadow: '0 0 12px var(--th-accent)50',
              transition: 'box-shadow .2s, transform .1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px var(--th-accent)80';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px var(--th-accent)50';
              e.currentTarget.style.transform = 'none';
            }}
            aria-label="Add new task"
          >
            + Add Task
          </button>

          {/* User */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px',
              background: 'var(--th-surface)',
              border: '1px solid var(--th-border)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg,var(--th-accent),var(--th-accent)aa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {userEmail.slice(0, 2).toUpperCase()}
            </div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--th-text2)',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--th-text3)',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'inherit',
                padding: 0,
                transition: 'color .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--th-text3)')
              }
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── MODE TABS ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--th-surface)',
          borderBottom: '1px solid var(--th-border)',
          padding: '0 20px',
          display: 'flex',
          gap: 0,
          alignItems: 'center',
        }}
      >
        {TABS.map((t) => (
          <ModeTab
            key={t.id}
            label={t.label}
            icon={t.icon}
            active={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
          />
        ))}
        {saving && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: 'var(--th-text3)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--th-accent)',
                display: 'inline-block',
                animation: 'pulse-glow .8s ease infinite',
              }}
            />
            saving…
          </span>
        )}
      </div>

      {/* ── FILTER BAR ───────────────────────────────────────────────────────── */}
      {showFilterBar && (
        <div
          style={{
            background: 'var(--th-bg)',
            borderBottom: '1px solid var(--th-border2)',
            padding: '8px 24px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--th-text3)',
                fontSize: 11,
                pointerEvents: 'none',
              }}
            >
              ⌕
            </span>
            <input
              value={searchQ}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID or summary…"
              style={{
                background: 'var(--th-surface2)',
                border: '1px solid var(--th-border)',
                borderRadius: 6,
                padding: '5px 10px 5px 26px',
                color: 'var(--th-text)',
                fontSize: 11,
                width: 180,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--th-accent)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--th-border)')}
            />
          </div>
          {activeTab !== 'kanban' && (
            <FSelect
              value={filterStatus}
              onChange={setFS}
              opts={['all', ...STATUS_OPTS]}
              label="Status"
            />
          )}
          <FSelect
            value={filterLabel}
            onChange={setFL}
            opts={['all', ...ALL_LABELS]}
            label="Label"
          />
          <FSelect
            value={filterMember}
            onChange={setFM}
            opts={['all', ...MEMBERS]}
            label="Assignee"
          />
          {hasFilter && (
            <button
              onClick={() => {
                setFS('all');
                setFL('all');
                setFM('all');
                setSearch('');
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                background: 'none',
                border: '1px solid var(--th-border)',
                color: 'var(--th-text2)',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = '#F43F5E60')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'var(--th-border)')
              }
            >
              ✕ Clear
            </button>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: 'var(--th-text3)',
            }}
          >
            {(activeTab === 'kanban' ? sorted : sortedWithStatus).length} tasks
          </span>
        </div>
      )}

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        {activeTab === 'kanban' && (
          <KanbanView
            tasks={sorted}
            onEdit={(t) => {
              setEditTask(t);
              setAddModal(true);
            }}
            onStatusChange={changeStatus}
            onAddTask={openAddModal}
          />
        )}
        {activeTab === 'backlog' && (
          <BacklogView
            tasks={sortedWithStatus}
            onEdit={(t) => {
              setEditTask(t);
              setAddModal(true);
            }}
            onCycle={cycleStatus}
            onDone={markDone}
            onDelete={deleteTask}
          />
        )}
        {activeTab === 'assignee' && (
          <AssigneeView
            tasks={sortedWithStatus}
            onCycle={cycleStatus}
            onDone={markDone}
          />
        )}
        {activeTab === 'workflow' && <WorkflowView tasks={tasks} />}
        {activeTab === 'deliverables' && <DeliverablesView tasks={tasks} />}
      </div>

      {/* ── MODAL ────────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <TaskModal
          initial={
            editTask ?? {
              id: '',
              summary: '',
              label: 'Core Game',
              status: defaultStatus,
              priority: 'Medium',
              assignee: '',
              start_date: null,
              end_date: null,
              sprint: 'Build 1',
              note: '',
            }
          }
          onSave={handleSaveTask}
          onClose={() => {
            setAddModal(false);
            setEditTask(null);
          }}
        />
      )}

      {/* ── BOT ──────────────────────────────────────────────────────────────── */}
      {showBot && (
        <BotPanel
          alerts={alerts}
          tasks={tasks}
          onClose={() => setShowBot(false)}
        />
      )}

      {/* ── TOAST ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background:
              toast.type === 'error' ? '#1a0814' : 'var(--th-surface)',
            border: `1px solid ${toast.type === 'error' ? '#F43F5E' : '#059669'}`,
            color: toast.type === 'error' ? '#F87171' : '#34D399',
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 700,
            zIndex: 9999,
            boxShadow: `0 4px 24px ${toast.type === 'error' ? '#F43F5E30' : '#05966930'}`,
            animation: 'slideIn .2s ease',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
