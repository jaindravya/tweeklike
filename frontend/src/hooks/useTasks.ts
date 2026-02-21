import { useState, useCallback, useEffect } from 'react';
import type { Task, Subtask, RecurrenceRule, TaskColor, TaskCategory } from '../types';
import { toDateString, isPast, getRecurrenceDates } from '../utils/dateUtils';

let nextId = 100;
function genId(): string {
  return String(nextId++);
}

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Work on Cloud project',
    completed: true,
    date: '2026-02-16',
    category: 'academic',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '2',
    title: 'Send email to Nick',
    completed: true,
    date: '2026-02-16',
    category: 'personal',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '3',
    title: 'Set up VM with Prakash',
    completed: false,
    date: '2026-02-17',
    category: 'academic',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '4',
    title: 'Try containerize your project',
    completed: false,
    date: '2026-02-18',
    category: 'academic',
    isLabel: false,
    color: 'pink',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '5',
    title: '<3 leetcode',
    completed: false,
    date: '2026-02-20',
    category: 'academic',
    isLabel: false,
    color: 'purple',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '6',
    title: 'Set meeting with counselor',
    completed: false,
    date: '2026-02-20',
    category: 'academic',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 1,
  },
  {
    id: '7',
    title: 'Containerize DB',
    completed: false,
    date: '2026-02-20',
    category: 'academic',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 2,
  },
  {
    id: '12',
    title: 'Fold clothes',
    completed: false,
    date: '2026-02-20',
    category: 'personal',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '8',
    title: 'New personal project',
    completed: false,
    date: '2026-02-21',
    category: 'personal',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '9',
    title: 'Tweek like website',
    completed: false,
    date: '2026-02-21',
    category: 'academic',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '10',
    title: 'Summer goals: internship, leetcode, interview prep',
    completed: false,
    date: null,
    category: 'academic',
    isLabel: false,
    color: 'yellow',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 0,
  },
  {
    id: '11',
    title: 'Practice reading Hindi',
    completed: false,
    date: null,
    category: 'personal',
    isLabel: false,
    color: 'none',
    notes: '',
    subtasks: [],
    recurrence: null,
    order: 1,
  },
];

function migrateTasks(tasks: Task[]): Task[] {
  return tasks.map((t) => ({
    ...t,
    category: t.category ?? 'personal',
    isLabel: t.isLabel ?? false,
    recurringParentId: t.recurringParentId ?? undefined,
  }));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('tweeklike-tasks');
    if (saved) {
      try {
        return migrateTasks(JSON.parse(saved) as Task[]);
      } catch {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('tweeklike-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((title: string, date: string | null, category: TaskCategory = 'personal') => {
    setTasks((prev) => {
      const matching = prev.filter((t) => t.date === date && t.category === category);
      const newTask: Task = {
        id: genId(),
        title,
        completed: false,
        date,
        category,
        isLabel: false,
        color: 'none',
        notes: '',
        subtasks: [],
        recurrence: null,
        order: matching.length,
      };
      return [...prev, newTask];
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const deleteTaskAndFuture = useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (!task) return prev;

      const parentId = task.recurringParentId ?? id;
      return prev.filter((t) => {
        if (t.id === id) return false;
        if (t.recurringParentId === parentId && t.date && task.date && t.date >= task.date) return false;
        return true;
      });
    });
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const sub: Subtask = { id: genId(), title, completed: false };
        return { ...t, subtasks: [...t.subtasks, sub] };
      })
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
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
  }, []);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) };
      })
    );
  }, []);

  const setTaskColor = useCallback((id: string, color: TaskColor) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, color } : t))
    );
  }, []);

  const setRecurrence = useCallback(
    (id: string, recurrence: RecurrenceRule | null) => {
      setTasks((prev) => {
        // remove old generated instances (uncompleted ones only)
        const withoutOldInstances = prev.filter(
          (t) => !(t.recurringParentId === id && !t.completed)
        );

        const task = withoutOldInstances.find((t) => t.id === id);
        if (!task) return prev;

        // update the recurrence rule on the template task
        const updated = withoutOldInstances.map((t) =>
          t.id === id ? { ...t, recurrence } : t
        );

        if (!recurrence || !task.date) return updated;

        // generate instances on future dates
        const dates = getRecurrenceDates(task.date, recurrence);
        const existingDates = new Set(
          updated
            .filter((t) => t.recurringParentId === id)
            .map((t) => t.date)
        );

        const newInstances: Task[] = dates
          .filter((d) => !existingDates.has(d))
          .map((date) => ({
            id: genId(),
            title: task.title,
            completed: false,
            date,
            category: task.category,
            isLabel: false,
            color: task.color,
            notes: task.notes,
            subtasks: [],
            recurrence: null,
            recurringParentId: id,
            order: 0,
          }));

        return [...updated, ...newInstances];
      });
    },
    []
  );

  const moveTask = useCallback(
    (taskId: string, newDate: string | null, newCategory: TaskCategory, newIndex: number) => {
      setTasks((prev) => {
        const task = prev.find((t) => t.id === taskId);
        if (!task) return prev;

        const withoutTask = prev.filter((t) => t.id !== taskId);
        const tasksInTarget = withoutTask
          .filter((t) => t.date === newDate && t.category === newCategory)
          .sort((a, b) => a.order - b.order);

        tasksInTarget.splice(newIndex, 0, { ...task, date: newDate, category: newCategory });
        const reordered = tasksInTarget.map((t, i) => ({ ...t, order: i }));

        const others = withoutTask.filter((t) => !(t.date === newDate && t.category === newCategory));
        return [...others, ...reordered];
      });
    },
    []
  );

  const rolloverTasks = useCallback(() => {
    const todayStr = toDateString(new Date());
    setTasks((prev) => {
      let changed = false;
      const updated = prev.map((t) => {
        if (t.date && !t.completed && !t.isLabel && !t.recurringParentId && isPast(t.date)) {
          changed = true;
          return { ...t, date: todayStr };
        }
        return t;
      });
      return changed ? updated : prev;
    });
  }, []);

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
