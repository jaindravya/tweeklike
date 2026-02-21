import { useState, useEffect } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import Header from './components/Header';
import WeekView from './components/WeekView';
import SomedaySection from './components/SomedaySection';
import TaskModal from './components/TaskModal';
import { useTasks } from './hooks/useTasks';
import { useTheme } from './hooks/useTheme';
import { getWeekDates, addWeeks, formatMonthYear } from './utils/dateUtils';
import type { Task, TaskCategory } from './types';
import './App.css';

function parseDroppableId(id: string): { date: string | null; category: TaskCategory } {
  if (id === 'someday') {
    return { date: null, category: 'personal' };
  }
  const [date, category] = id.split(':');
  return { date, category: (category as TaskCategory) ?? 'personal' };
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { theme, setTheme, themes } = useTheme();

  const {
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
  } = useTasks();

  useEffect(() => {
    rolloverTasks();
  }, [rolloverTasks]);

  const weekDates = getWeekDates(currentDate);
  const title = formatMonthYear(weekDates);

  const handlePrevWeek = () => setCurrentDate((d) => addWeeks(d, -1));
  const handleNextWeek = () => setCurrentDate((d) => addWeeks(d, 1));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const { date, category } = parseDroppableId(destination.droppableId);
    moveTask(draggableId, date, category, destination.index);
  };

  const handleClickTask = (task: Task) => setSelectedTask(task);
  const handleCloseModal = () => setSelectedTask(null);

  const liveTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) ?? null
    : null;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="app">
        <Header
          title={title}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          currentTheme={theme}
          themes={themes}
          onSetTheme={setTheme}
        />
        <WeekView
          weekDates={weekDates}
          getTasksForDate={getTasksForDate}
          getLabelsForDate={getLabelsForDate}
          onToggle={toggleComplete}
          onClickTask={handleClickTask}
          onAddTask={addTask}
        />
        <SomedaySection
          tasks={somedayTasks}
          onToggle={toggleComplete}
          onClickTask={handleClickTask}
          onAddTask={(title) => addTask(title, null)}
        />
        {liveTask && (
          <TaskModal
            task={liveTask}
            onClose={handleCloseModal}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onDeleteFuture={deleteTaskAndFuture}
            onToggleComplete={toggleComplete}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            onSetColor={setTaskColor}
            onSetRecurrence={setRecurrence}
          />
        )}
      </div>
    </DragDropContext>
  );
}
