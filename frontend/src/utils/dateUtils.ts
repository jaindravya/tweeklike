const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** return the monday of the week containing `date`. */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** return an array of 7 date objects (mon–sun) for the week containing `date`. */
export function getWeekDates(date: Date): Date[] {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDayHeader(date: Date): {
  dayName: string;
  dateLabel: string;
} {
  return {
    dayName: DAY_NAMES[date.getDay()],
    dateLabel: `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`,
  };
}

export function formatMonthYear(dates: Date[]): string {
  const months = new Set(dates.map((d) => d.getMonth()));
  const years = new Set(dates.map((d) => d.getFullYear()));

  if (months.size === 1) {
    return `${MONTH_NAMES[[...months][0]]} ${[...years][0]}`;
  }
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.getFullYear() === last.getFullYear()) {
    return `${MONTH_NAMES[first.getMonth()]} / ${MONTH_NAMES[last.getMonth()]} ${first.getFullYear()}`;
  }
  return `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()} / ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDate(dateStr) < today;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * generate future dates where a recurring task should appear.
 * produces dates for ~4 weeks ahead from the task's start date.
 */
export function getRecurrenceDates(
  startDateStr: string,
  rule: { type: string; interval?: number; daysOfWeek?: number[] },
  weeksAhead = 4
): string[] {
  const start = parseDate(startDateStr);
  const end = addDays(start, weeksAhead * 7);
  const dates: string[] = [];

  switch (rule.type) {
    case 'daily': {
      let d = addDays(start, 1);
      while (d <= end) {
        dates.push(toDateString(d));
        d = addDays(d, 1);
      }
      break;
    }
    case 'weekly': {
      let d = addDays(start, 7);
      while (d <= end) {
        dates.push(toDateString(d));
        d = addDays(d, 7);
      }
      break;
    }
    case 'monthly': {
      const dayOfMonth = start.getDate();
      for (let m = 1; m <= 3; m++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + m);
        d.setDate(dayOfMonth);
        if (d.getDate() === dayOfMonth) {
          dates.push(toDateString(d));
        }
      }
      break;
    }
    case 'custom': {
      const interval = rule.interval ?? 1;
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        let d = addDays(start, 1);
        while (d <= end) {
          if (rule.daysOfWeek.includes(d.getDay())) {
            dates.push(toDateString(d));
          }
          d = addDays(d, 1);
        }
      } else {
        let d = addDays(start, interval);
        while (d <= end) {
          dates.push(toDateString(d));
          d = addDays(d, interval);
        }
      }
      break;
    }
  }
  return dates;
}
