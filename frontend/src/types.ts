export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // e.g. every 3 days
  daysOfWeek?: number[]; // 0=sun, 1=mon, ... 6=sat — for custom
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export const PRESET_COLORS = [
  'none',
  'pink',
  'purple',
  'yellow',
  'green',
  'blue',
  'orange',
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];

/** a preset name like 'pink' or a custom hex like '#ff9900' */
export type TaskColor = PresetColor | string;

export function isPresetColor(c: string): c is PresetColor {
  return (PRESET_COLORS as readonly string[]).includes(c);
}

export type TaskCategory = 'academic' | 'personal';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  date: string | null; // iso date string (yyyy-mm-dd) or null for "someday"
  category: TaskCategory;
  isLabel: boolean;
  color: TaskColor;
  notes: string;
  subtasks: Subtask[];
  recurrence: RecurrenceRule | null;
  order: number;
}
