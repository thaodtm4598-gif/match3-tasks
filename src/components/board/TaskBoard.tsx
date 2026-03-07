'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskStatus } from '@/types/task';
import { STATUS_OPTS, MEMBERS, ALL_LABELS } from '@/lib/constants';
import { genId, getDeadlineAlerts } from '@/lib/helpers';
import { Btn, Tab, FSelect } from '@/components/ui';
import BacklogView      from './views/BacklogView';
import AssigneeView     from './views/AssigneeView';
import WorkflowView     from './views/WorkflowView';
import DeliverablesView from './views/DeliverablesView';
import TaskModal        from './TaskModal';
import BotPanel         from './BotPanel';


type TabId = 'backlog' | 'assignee' | 'workflow' | 'deliverables';

interface Toast { msg: string; type: 'success' | 'error' }

interface Props {
  initialTasks: Task[];
  userEmail: string;
}

export default function TaskBoard({ initialTasks, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tasks,       setTasks]      = useState<Task[]>(initialTasks);
  const [activeTab,   setActiveTab]  = useState<TabId>('backlog');
  const [filterStatus, setFS]        = useState('all');
  const [filterLabel,  setFL]        = useState('all');
  const [filterMember, setFM]        = useState('all');
  const [searchQ,      setSearch]    = useState('');
  const [showAddModal, setAddModal]  = useState(false);
  const [editTask,     setEditTask]  = useState<Task | null>(null);
  const [showBot,      setShowBot]   = useState(false);
  const [saving,       setSaving]    = useState(false);
  const [toast,        setToast]     = useState<Toast | null>(null);

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => {
              if (prev.find(t => t.id === (payload.new as Task).id)) return prev;
              return [payload.new as Task, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev =>
              prev.map(t => (t.id === (payload.new as Task).id ? (payload.new as Task) : t)),
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== (payload.old as { id: string }).id));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  function showToast(msg: string, type: Toast['type'] = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const visible = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status   !== filterStatus)  return false;
    if (filterLabel  !== 'all' && t.label    !== filterLabel)   return false;
    if (filterMember !== 'all' && t.assignee !== filterMember)  return false;
    if (searchQ && !t.summary.toLowerCase().includes(searchQ.toLowerCase()) &&
        !t.id.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSaveTask = useCallback(async (data: Omit<Task, 'created_at' | 'updated_at'>) => {
    setSaving(true);
    const isEdit = !!(data.id && tasks.find(t => t.id === data.id));

    if (isEdit) {
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
      const { error } = await supabase.from('tasks').update(data).eq('id', data.id);
      if (error) { showToast('Error: ' + error.message, 'error'); }
      else        { showToast(`✓ Updated ${data.id}`); }
    } else {
      const newTask = { ...data, id: genId() };
      // Optimistic add
      setTasks(prev => [newTask, ...prev]);
      const { error } = await supabase.from('tasks').insert(newTask);
      if (error) {
        setTasks(prev => prev.filter(t => t.id !== newTask.id));
        showToast('Error: ' + error.message, 'error');
      } else {
        showToast(`✓ Added task → ${data.assignee || 'team'}`);
      }
    }
    setSaving(false);
    setAddModal(false);
    setEditTask(null);
  }, [tasks, supabase]);

  const cycleStatus = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const idx  = STATUS_OPTS.indexOf(task.status as typeof STATUS_OPTS[number]);
    const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length] as TaskStatus;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    await supabase.from('tasks').update({ status: next }).eq('id', id);
  }, [tasks, supabase]);

  const markDone = useCallback(async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'Done' } : t));
    await supabase.from('tasks').update({ status: 'Done' }).eq('id', id);
    showToast('✓ Task marked as Done!');
  }, [supabase]);

  const deleteTask = useCallback(async (id: string) => {
    if (!confirm('Delete this task?')) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
    showToast('Task deleted', 'error');
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const alerts = getDeadlineAlerts(tasks);
  const kpi = {
    total: tasks.length,
    done:  tasks.filter(t => t.status === 'Done').length,
    wip:   tasks.filter(t => t.status === 'In Progress').length,
    todo:  tasks.filter(t => t.status === 'To Do').length,
    alert: alerts.length,
  };

  const hasFilter = filterStatus !== 'all' || filterLabel !== 'all' || filterMember !== 'all' || !!searchQ;

  return (
    <div
      style={{
        background: '#090b10',
        color: '#dde3f0',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          background: '#0e1220',
          borderBottom: '1px solid #1a2035',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-.3px' }}>
            Match&thinsp;3 <span style={{ color: '#4a90d9' }}>Build 1.2</span>
          </div>
          <div style={{ fontSize: 11, color: '#3c4870', marginTop: 2 }}>
            Sprint Mar 2026 · Task Board
          </div>
        </div>

        {/* KPIs */}
        {[
          { n: kpi.total, l: 'Total',    c: '#7090c0' },
          { n: kpi.done,  l: 'Done',     c: '#3ecf7a' },
          { n: kpi.wip,   l: 'In Prog',  c: '#f0a030' },
          { n: kpi.todo,  l: 'To Do',    c: '#7090c0' },
          { n: kpi.alert, l: '⚠️ Alerts', c: '#f05060' },
        ].map(k => (
          <div key={k.l} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.c, fontVariantNumeric: 'tabular-nums' }}>
              {k.n}
            </div>
            <div style={{ fontSize: 9, color: '#3c4870', textTransform: 'uppercase', letterSpacing: 1 }}>
              {k.l}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginLeft: 8, alignItems: 'center' }}>
          {/* Bot button */}
          <Btn
            onClick={() => setShowBot(!showBot)}
            style={{
              background: alerts.length > 0 ? '#2a0a0a' : '#0e1220',
              border: `1px solid ${alerts.length > 0 ? '#f0506080' : '#1a2035'}`,
              color: alerts.length > 0 ? '#f05060' : '#506090',
              position: 'relative',
            }}
          >
            🤖 Bot
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#f05060',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 14,
                  height: 14,
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                }}
              >
                {alerts.length}
              </span>
            )}
          </Btn>

          <Btn primary onClick={() => setAddModal(true)}>+ Add Task</Btn>

          {/* User + logout */}
          <div
            style={{
              marginLeft: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 10px',
              background: '#0a0d14',
              border: '1px solid #1a2035',
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#3c5070', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: '#3c4870',
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: 'inherit',
                padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f05060')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3c4870')}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── TABS ── */}
      <div
        style={{
          background: '#0e1220',
          borderBottom: '1px solid #1a2035',
          padding: '0 24px',
          display: 'flex',
          gap: 0,
        }}
      >
        {(
          [
            ['backlog',      '📋 Backlog'],
            ['assignee',     '👤 By Assignee'],
            ['workflow',     '🔗 Workflows'],
            ['deliverables', '📦 Deliverables'],
          ] as [TabId, string][]
        ).map(([id, label]) => (
          <Tab key={id} active={activeTab === id} onClick={() => setActiveTab(id)}>
            {label}
          </Tab>
        ))}
        {saving && (
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 10, color: '#3c4870' }}>
            saving…
          </span>
        )}
      </div>

      {/* ── FILTER BAR ── */}
      {(activeTab === 'backlog' || activeTab === 'assignee') && (
        <div
          style={{
            background: '#0b0d14',
            borderBottom: '1px solid #141828',
            padding: '10px 24px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            value={searchQ}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search tasks…"
            style={{
              background: '#0e1220',
              border: '1px solid #1a2035',
              borderRadius: 6,
              padding: '5px 10px',
              color: '#dde3f0',
              fontSize: 11,
              width: 160,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <FSelect value={filterStatus} onChange={setFS} opts={['all', ...STATUS_OPTS]} label="Status" />
          <FSelect value={filterLabel}  onChange={setFL} opts={['all', ...ALL_LABELS]}  label="Label"  />
          <FSelect value={filterMember} onChange={setFM} opts={['all', ...MEMBERS]}     label="Assignee" />
          {hasFilter && (
            <Btn
              onClick={() => { setFS('all'); setFL('all'); setFM('all'); setSearch(''); }}
              style={{ fontSize: 10, padding: '3px 8px', color: '#506090' }}
            >
              ✕ Clear
            </Btn>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3c4870' }}>
            {visible.length} tasks
          </span>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {activeTab === 'backlog' && (
          <BacklogView
            tasks={visible}
            onEdit={t => { setEditTask(t); setAddModal(true); }}
            onCycle={cycleStatus}
            onDone={markDone}
            onDelete={deleteTask}
          />
        )}
        {activeTab === 'assignee' && (
          <AssigneeView tasks={visible} onCycle={cycleStatus} onDone={markDone} />
        )}
        {activeTab === 'workflow'     && <WorkflowView tasks={tasks} />}
        {activeTab === 'deliverables' && <DeliverablesView tasks={tasks} />}
      </div>

      {/* ── MODAL ── */}
      {showAddModal && (
        <TaskModal
          initial={editTask}
          onSave={handleSaveTask}
          onClose={() => { setAddModal(false); setEditTask(null); }}
        />
      )}

      {/* ── BOT PANEL ── */}
      {showBot && <BotPanel alerts={alerts} tasks={tasks} onClose={() => setShowBot(false)} />}

      {/* ── TOAST ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: toast.type === 'error' ? '#2a0808' : '#082a18',
            border: `1px solid ${toast.type === 'error' ? '#f05060' : '#3ecf7a'}`,
            color:  toast.type === 'error' ? '#f07070' : '#3ecf7a',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 12,
            fontWeight: 600,
            zIndex: 9999,
            boxShadow: '0 4px 20px rgba(0,0,0,.5)',
            animation: 'slideIn .2s ease',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
