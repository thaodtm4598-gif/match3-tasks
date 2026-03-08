'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '@/types/task';
import { LABEL_META, PRIORITY_STYLE } from '@/lib/constants';
import { daysUntil, fmt } from '@/lib/helpers';
import { LabelPill } from '@/components/ui';

// ── Column config ──────────────────────────────────────────────────────────────
const COLUMNS: {
  status: TaskStatus;
  color: string;
  bg: string;
  dim: string;
  icon: string;
}[] = [
  {
    status: 'Open',
    color: '#7C3AED',
    bg: '#0d0820',
    dim: '#7C3AED22',
    icon: '◆',
  },
  {
    status: 'To Do',
    color: '#2563EB',
    bg: '#060d1f',
    dim: '#2563EB22',
    icon: '◈',
  },
  {
    status: 'In Progress',
    color: '#D97706',
    bg: '#1a0e00',
    dim: '#D9770622',
    icon: '◉',
  },
  {
    status: 'Done',
    color: '#059669',
    bg: '#011a10',
    dim: '#05966922',
    icon: '◎',
  },
];

// ── QuickStatusPicker ─────────────────────────────────────────────────────────
function QuickStatusPicker({
  current,
  onSelect,
  onClose,
}: {
  current: TaskStatus;
  onSelect: (s: TaskStatus) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '110%',
        left: 0,
        zIndex: 500,
        background: 'var(--th-surface2)',
        border: '1px solid var(--th-border)',
        borderRadius: 8,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minWidth: 140,
        boxShadow: '0 8px 32px rgba(0,0,0,.7)',
        animation: 'slideIn .15s ease',
      }}
      onMouseLeave={onClose}
    >
      {COLUMNS.map((col) => (
        <button
          key={col.status}
          onClick={() => {
            onSelect(col.status);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px',
            background: current === col.status ? col.dim : 'transparent',
            border: `1px solid ${current === col.status ? col.color + '60' : 'transparent'}`,
            borderRadius: 5,
            color: col.color,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            transition: 'background .1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = col.dim)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background =
              current === col.status ? col.dim : 'transparent')
          }
        >
          <span style={{ fontSize: 10 }}>{col.icon}</span>
          {col.status}
          {current === col.status && (
            <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── KanbanCard ────────────────────────────────────────────────────────────────
function KanbanCard({
  task,
  overlay = false,
  onEdit,
  onStatusChange,
}: {
  task: Task;
  overlay?: boolean;
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);

  const d = daysUntil(task.end_date);
  const overdue = d !== null && d < 0 && task.status !== 'Done';
  const dueToday = d !== null && d === 0 && task.status !== 'Done';
  const dueSoon = d !== null && d <= 2 && d > 0 && task.status !== 'Done';
  const isDone = task.status === 'Done';

  const labelMeta = LABEL_META[task.label] ?? {
    bg: '#1a1e2a',
    fg: '#8090b0',
    dot: '#5060a0',
  };
  const priorityMeta =
    PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE['Medium'];
  const col = COLUMNS.find((c) => c.status === task.status) ?? COLUMNS[0];

  const dueDateColor = overdue
    ? '#F87171'
    : dueToday
      ? '#FBBF24'
      : dueSoon
        ? '#FCD34D'
        : 'var(--th-text3)';

  return (
    <div
      style={{
        background: isDone ? 'var(--th-surface)' : 'var(--th-card)',
        border: `1px solid ${isDone ? 'var(--th-border2)' : labelMeta.dot + '44'}`,
        borderLeft: `3px solid ${isDone ? 'var(--th-border2)' : col.color}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: overlay ? 'grabbing' : 'grab',
        opacity: isDone ? 0.55 : 1,
        transition: 'box-shadow .15s, opacity .2s',
        position: 'relative',
        userSelect: 'none',
      }}
      className={isDone ? 'gem-done' : ''}
    >
      {/* Header row: ID + priority + drag handle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--th-text2)',
            fontSize: 10,
            fontWeight: 800,
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'var(--font-geist-mono, monospace)',
            letterSpacing: '.5px',
          }}
        >
          {task.id}
        </button>
        <span
          style={{ marginLeft: 'auto', fontSize: 13 }}
          title={task.priority}
        >
          {priorityMeta.icon}
        </span>
        {/* drag hint */}
        <span style={{ color: 'var(--th-text3)', fontSize: 12, lineHeight: 1 }}>
          ⠿
        </span>
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: 12,
          lineHeight: 1.45,
          color: isDone ? 'var(--th-text3)' : 'var(--th-text)',
          marginBottom: 8,
          textDecoration: isDone ? 'line-through' : 'none',
          wordBreak: 'break-word',
        }}
      >
        {task.summary}
        {task.note && (
          <span style={{ marginLeft: 4, color: 'var(--th-text3)' }}>📝</span>
        )}
      </div>

      {/* Label */}
      <div style={{ marginBottom: 8 }}>
        <LabelPill label={task.label} />
      </div>

      {/* Footer: status badge + assignee + due */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        {/* Status quick-picker */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStatusOpen((o) => !o);
            }}
            style={{
              background: col.dim,
              border: `1px solid ${col.color}50`,
              borderRadius: 4,
              color: col.color,
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = col.color)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = col.color + '50')
            }
          >
            {col.icon} {task.status}
          </button>
          {statusOpen && (
            <QuickStatusPicker
              current={task.status}
              onSelect={(s) => onStatusChange(task.id, s)}
              onClose={() => setStatusOpen(false)}
            />
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'var(--th-surface)',
              border: '1px solid var(--th-border2)',
              borderRadius: 12,
              padding: '2px 7px 2px 4px',
              maxWidth: 120,
            }}
          >
            <AssigneeAvatar name={task.assignee} size={16} />
            <span
              style={{
                fontSize: 9,
                color: 'var(--th-text2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 80,
              }}
            >
              {task.assignee}
            </span>
          </div>
        )}

        {/* Due date */}
        {task.end_date && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: overdue || dueToday ? 700 : 400,
              color: dueDateColor,
              whiteSpace: 'nowrap',
            }}
          >
            {overdue && '⚠ '}
            {dueToday && '🔔 '}
            {fmt(task.end_date)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── AssigneeAvatar ────────────────────────────────────────────────────────────
function AssigneeAvatar({ name, size = 20 }: { name: string; size?: number }) {
  const initials = name
    .replace(/[^A-Za-z\u00C0-\u1EF9]/g, '')
    .slice(0, 2)
    .toUpperCase();
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `hsl(${hue},50%,22%)`,
        border: `1.5px solid hsl(${hue},60%,38%)`,
        color: `hsl(${hue},70%,65%)`,
        fontSize: size * 0.4,
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

// ── DraggableCard ─────────────────────────────────────────────────────────────
function DraggableCard({
  task,
  onEdit,
  onStatusChange,
}: {
  task: Task;
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
    });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.25 : 1,
        transition: isDragging ? 'none' : 'opacity .15s',
        touchAction: 'none',
      }}
    >
      <KanbanCard task={task} onEdit={onEdit} onStatusChange={onStatusChange} />
    </div>
  );
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  color,
  bg,
  icon,
  tasks,
  isOver,
  onEdit,
  onStatusChange,
  onAddTask,
}: {
  status: TaskStatus;
  color: string;
  bg: string;
  icon: string;
  tasks: Task[];
  isOver: boolean;
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const doneCount = tasks.filter((t) => t.status === 'Done').length;

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 270,
        flex: 1,
        background: isOver ? bg : 'var(--th-card)',
        border: `1px solid ${isOver ? color + '80' : 'var(--th-border)'}`,
        borderTop: `3px solid ${color}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color .15s, background .15s, box-shadow .15s',
        boxShadow: isOver ? `0 0 20px ${color}30` : 'none',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '12px 14px 10px',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color, fontSize: 14, lineHeight: 1 }}>{icon}</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: 13,
            color,
            letterSpacing: '.2px',
          }}
        >
          {status}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            background: color + '22',
            color,
            border: `1px solid ${color}44`,
            borderRadius: 10,
            padding: '1px 8px',
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          {tasks.length}
        </span>
        {status !== 'Done' && (
          <button
            onClick={() => onAddTask(status)}
            title="Add task"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: color + '22',
              border: `1px solid ${color}44`,
              color,
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = color + '44')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = color + '22')
            }
          >
            +
          </button>
        )}
      </div>

      {/* Progress bar for Done column */}
      {status === 'Done' && tasks.length > 0 && (
        <div style={{ height: 2, background: 'var(--th-surface)' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round((doneCount / tasks.length) * 100)}%`,
              background: color,
              transition: 'width .3s',
            }}
          />
        </div>
      )}

      {/* Drop zone hint */}
      {isOver && (
        <div
          style={{
            margin: '8px 10px 0',
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: 'shimmer 1s ease infinite',
            backgroundSize: '200% 100%',
          }}
        />
      )}

      {/* Cards */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 80,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 10px',
              color: color + '44',
              fontSize: 11,
              border: `1px dashed ${color}22`,
              borderRadius: 6,
            }}
          >
            {isOver ? 'Drop here' : 'Empty'}
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Sort tasks within a column ─────────────────────────────────────────────────
const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function sortColumnTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1;
    const pb = PRIORITY_ORDER[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    if (a.end_date && b.end_date) return a.end_date.localeCompare(b.end_date);
    if (a.end_date) return -1;
    if (b.end_date) return 1;
    return 0;
  });
}

// ── KanbanView ────────────────────────────────────────────────────────────────
interface Props {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

export default function KanbanView({
  tasks,
  onEdit,
  onStatusChange,
  onAddTask,
}: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    const t = tasks.find((t) => t.id === active.id);
    setActiveTask(t ?? null);
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverColumnId(over ? String(over.id) : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    setOverColumnId(null);
    if (!over) return;
    const newStatus = String(over.id) as TaskStatus;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.status !== newStatus) {
      onStatusChange(String(active.id), newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          minHeight: 'calc(100vh - 200px)',
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        {COLUMNS.map((col) => {
          const colTasks = sortColumnTasks(
            tasks.filter((t) => t.status === col.status),
          );
          return (
            <KanbanColumn
              key={col.status}
              {...col}
              tasks={colTasks}
              isOver={overColumnId === col.status}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
              onAddTask={onAddTask}
            />
          );
        })}
      </div>

      {/* Drag overlay — the "ghost" card while dragging */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeTask ? (
          <div
            style={{
              width: 270,
              opacity: 0.95,
              transform: 'rotate(2deg) scale(1.02)',
            }}
          >
            <KanbanCard
              task={activeTask}
              overlay
              onEdit={() => {}}
              onStatusChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
