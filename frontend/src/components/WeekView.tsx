import type { Task, TaskCategory } from '../types';
import DayColumn from './DayColumn';
import { toDateString, formatDayHeader, isToday } from '../utils/dateUtils';

interface WeekViewProps {
  weekDates: Date[];
  getTasksForDate: (date: string, category: TaskCategory) => Task[];
  getLabelsForDate: (date: string) => Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onAddTask: (title: string, date: string, category: TaskCategory) => void;
}

export default function WeekView({
  weekDates,
  getTasksForDate,
  getLabelsForDate,
  onToggle,
  onClickTask,
  onAddTask,
}: WeekViewProps) {
  const weekdays = weekDates.slice(0, 5);
  const saturday = weekDates[5];
  const sunday = weekDates[6];

  const renderDay = (date: Date, compact = false) => {
    const dateStr = toDateString(date);
    const { dayName, dateLabel } = formatDayHeader(date);
    return (
      <DayColumn
        key={dateStr}
        dateStr={dateStr}
        dayName={dayName}
        dateLabel={dateLabel}
        isToday={isToday(date)}
        labels={getLabelsForDate(dateStr)}
        academicTasks={getTasksForDate(dateStr, 'academic')}
        personalTasks={getTasksForDate(dateStr, 'personal')}
        onToggle={onToggle}
        onClickTask={onClickTask}
        onAddTask={onAddTask}
        compact={compact}
      />
    );
  };

  return (
    <div className="week-view-wrapper">
      <div className="section-labels">
        <div className="section-labels-top">
          <span className="vertical-label">academic</span>
        </div>
        <div className="section-labels-bottom">
          <span className="vertical-label">personal</span>
        </div>
      </div>
      <div className="week-view">
        {weekdays.map((date) => renderDay(date))}
        <div className="weekend-column">
          {renderDay(saturday, true)}
          {renderDay(sunday, true)}
        </div>
      </div>
    </div>
  );
}
