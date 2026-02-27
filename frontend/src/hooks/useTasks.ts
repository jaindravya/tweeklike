import { useState, useCallback, useEffect, useRef } from 'react';
import type { Task, RecurrenceRule, TaskColor, TaskCategory } from '../types';

const API = '/api';

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`api error ${res.status}`);
  return res.json();
}

interface ApiTask {
  id: number;
  title: string;
  completed: boolean;
  date: string | null;
  category: TaskCategory;
  isLabel: boolean;
  color: string;
  notes: string;
  subtasks: { id: number; title: string; completed: boolean }[];
  recurrence: RecurrenceRule | null;
  recurringParentId: number | null;
  order: number;
}

function toTask(a: ApiTask): Task {
  return {
    id: String(a.id),
    title: a.title,
    completed: a.completed,
    date: a.date,
    category: a.category,
    isLabel: a.isLabel,
    color: a.color as TaskColor,
    notes: a.notes,
    subtasks: a.subtasks.map((s) => ({
      id: String(s.id),
      title: s.title,
      completed: s.completed,
    })),
    recurrence: a.recurrence,
    recurringParentId: a.recurringParentId ? String(a.recurringParentId) : undefined,
    order: a.order,
  };
}

let tempId = -1;
function nextTempId(): string {
  return String(tempId--);
}

export function useTasks(dateFrom?: string, dateTo?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    const params =
      dateFrom && dateTo ? `?date_from=${dateFrom}&date_to=${dateTo}` : '';
    const data = await apiFetch<ApiTask[]>(`/tasks${params}`);
    if (mountedRef.current) {
      setTasks(data.map(toTask));
      setLoaded(true);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (title: string, date: string | null, category: TaskCategory = 'personal') => {
      const tempTask: Task = {
        id: nextTempId(),
        title,
        completed: false,
        date,
        category,
        isLabel: false,
        color: 'none',
        notes: '',
        subtasks: [],
        recurrence: null,
        order: 999,
      };
      setTasks((prev) => [...prev, tempTask]);
      try {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({ title, date, category }),
        });
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      const body: Record<string, unknown> = {};
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.completed !== undefined) body.completed = updates.completed;
      if (updates.date !== undefined) body.date = updates.date;
      if (updates.category !== undefined) body.category = updates.category;
      if (updates.isLabel !== undefined) body.isLabel = updates.isLabel;
      if (updates.color !== undefined) body.color = updates.color;
      if (updates.notes !== undefined) body.notes = updates.notes;
      if (updates.order !== undefined) body.order = updates.order;

      try {
        await apiFetch(`/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const deleteTaskAndFuture = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        const parentId = task.recurringParentId ?? id;
        setTasks((prev) =>
          prev.filter((t) => {
            if (t.id === id) return false;
            if (
              (t.recurringParentId === parentId || t.id === parentId) &&
              t.date && task.date && t.date >= task.date &&
              t.id !== id
            ) {
              return t.id === parentId;
            }
            return true;
          })
        );
      }
      try {
        await apiFetch(`/tasks/${id}/future`, { method: 'DELETE' });
      } finally {
        await refresh();
      }
    },
    [tasks, refresh]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      );
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      try {
        await apiFetch(`/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: !task.completed }),
        });
      } catch {
        await refresh();
      }
    },
    [tasks, refresh]
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: [
              ...t.subtasks,
              { id: nextTempId(), title, completed: false },
            ],
          };
        })
      );
      try {
        await apiFetch(`/tasks/${taskId}/subtasks`, {
          method: 'POST',
          body: JSON.stringify({ title }),
        });
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      const sub = task?.subtasks.find((s) => s.id === subtaskId);
      if (!sub) return;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === subtaskId ? { ...s, completed: !s.completed } : s
            ),
          };
        })
      );
      try {
        await apiFetch(`/subtasks/${subtaskId}`, {
          method: 'PATCH',
          body: JSON.stringify({ completed: !sub.completed }),
        });
      } catch {
        await refresh();
      }
    },
    [tasks, refresh]
  );

  const deleteSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.filter((s) => s.id !== subtaskId),
          };
        })
      );
      try {
        await apiFetch(`/subtasks/${subtaskId}`, { method: 'DELETE' });
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const setTaskColor = useCallback(
    async (id: string, color: TaskColor) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, color } : t))
      );
      try {
        await apiFetch(`/tasks/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ color }),
        });
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const setRecurrence = useCallback(
    async (id: string, recurrence: RecurrenceRule | null) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, recurrence } : t))
      );
      try {
        if (recurrence) {
          await apiFetch(`/tasks/${id}/recurrence`, {
            method: 'POST',
            body: JSON.stringify(recurrence),
          });
        } else {
          await apiFetch(`/tasks/${id}/recurrence`, { method: 'DELETE' });
        }
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const moveTask = useCallback(
    async (taskId: string, newDate: string | null, newCategory: TaskCategory, newIndex: number) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task) return prev;
        const withoutTask = prev.filter((t) => t.id !== taskId);
        const target = withoutTask
          .filter((t) => t.date === newDate && t.category === newCategory && !t.isLabel)
          .sort((a, b) => a.order - b.order);
        target.splice(newIndex, 0, { ...task, date: newDate, category: newCategory });
        const reordered = target.map((t, i) => ({ ...t, order: i }));
        const others = withoutTask.filter(
          (t) => !(t.date === newDate && t.category === newCategory && !t.isLabel)
        );
        return [...others, ...reordered];
      });
      try {
        await apiFetch('/tasks/move', {
          method: 'POST',
          body: JSON.stringify({
            taskId: Number(taskId),
            newDate,
            newCategory,
            newIndex,
          }),
        });
      } catch {
        await refresh();
      }
    },
    [refresh]
  );

  const rolloverTasks = useCallback(async () => {
    await apiFetch('/tasks/rollover', { method: 'POST' });
    await refresh();
  }, [refresh]);

  const getTasksForDate = useCallback(
    (date: string | null, category: TaskCategory): Task[] => {
      return tasks
        .filter((t) => t.date === date && t.category === category && !t.isLabel)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  const getLabelsForDate = useCallback(
    (date: string): Task[] => {
      return tasks
        .filter((t) => t.date === date && t.isLabel)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  const somedayTasks = tasks
    .filter((t) => t.date === null)
    .sort((a, b) => a.order - b.order);

  return {
    tasks,
    loaded,
    addTask,
    updateTask,
    deleteTask,
    deleteTaskAndFuture,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setTaskColor,
    setRecurrence,
    moveTask,
    rolloverTasks,
    getTasksForDate,
    getLabelsForDate,
    somedayTasks,
  };
}
