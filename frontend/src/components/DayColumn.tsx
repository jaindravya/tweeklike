import { useState, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskCategory } from '../types';
import TaskCard from './TaskCard';

const MIN_LINES = 3;
const MIN_LINES_COMPACT = 1;

interface DayColumnProps {
  dateStr: string;
  dayName: string;
  dateLabel: string;
  isToday: boolean;
  labels: Task[];
  academicTasks: Task[];
  personalTasks: Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onAddTask: (title: string, date: string, category: TaskCategory) => void;
  compact?: boolean;
}

function SectionBlock({
  droppableId,
  tasks,
  onToggle,
  onClickTask,
  onAdd,
  minLines,
  editing,
  editInput,
}: {
  droppableId: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onAdd: () => void;
  minLines: number;
  editing: boolean;
  editInput: React.ReactNode;
}) {
  const emptyLines = Math.max(editing ? 0 : 1, minLines - tasks.length - (editing ? 1 : 0));

  return (
    <div className="section-block">
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`day-tasks${snapshot.isDraggingOver ? ' drag-over' : ''}`}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('.task-card')) onAdd();
            }}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onToggle={onToggle}
                onClick={onClickTask}
              />
            ))}
            {provided.placeholder}
            {editing && editInput}
            {Array.from({ length: emptyLines }, (_, i) => (
              <div key={`line-${i}`} className="notebook-line empty" />
            ))}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function DayColumn({
  dateStr,
  dayName,
  dateLabel,
  isToday,
  labels,
  academicTasks,
  personalTasks,
  onToggle,
  onClickTask,
  onAddTask,
  compact = false,
}: DayColumnProps) {
  const [editingSection, setEditingSection] = useState<TaskCategory | null>(null);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const minLines = compact ? MIN_LINES_COMPACT : MIN_LINES;

  const startEditing = (category: TaskCategory) => {
    setEditingSection(category);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim() && editingSection) {
      onAddTask(input.trim(), dateStr, editingSection);
      setInput('');
    }
    if (e.key === 'Escape') {
      setEditingSection(null);
      setInput('');
    }
  };

  const handleBlur = () => {
    if (input.trim() && editingSection) {
      onAddTask(input.trim(), dateStr, editingSection);
    }
    setInput('');
    setEditingSection(null);
  };

  const editInputNode = (
    <div className="notebook-line editing-line">
      <input
        ref={inputRef}
        className="inline-add-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        autoFocus
      />
    </div>
  );

  const hasLabels = labels.length > 0;

  return (
    <div className={`day-column${isToday ? ' today' : ''}`}>
      <div className="day-header">
        <span className={`day-date${isToday ? ' today-date' : ''}`}>{dateLabel}</span>
        <span className="day-name">{dayName}</span>
      </div>

      <div className="day-sections">
        <div className="section-top">
          {hasLabels && (
            <>
              <div className="label-section">
                {labels.map((label) => (
                  <div
                    key={label.id}
                    className="day-label"
                    onClick={() => onClickTask(label)}
                  >
                    <span className="day-label-icon">📌</span> {label.title}
                  </div>
                ))}
              </div>
              <div className="section-divider label-divider" />
            </>
          )}

          <SectionBlock
            droppableId={`${dateStr}:academic`}
            tasks={academicTasks}
            onToggle={onToggle}
            onClickTask={onClickTask}
            onAdd={() => startEditing('academic')}
            minLines={minLines}
            editing={editingSection === 'academic'}
            editInput={editingSection === 'academic' ? editInputNode : null}
          />
        </div>

        <div className="section-divider" />

        <SectionBlock
          droppableId={`${dateStr}:personal`}
          tasks={personalTasks}
          onToggle={onToggle}
          onClickTask={onClickTask}
          onAdd={() => startEditing('personal')}
          minLines={minLines}
          editing={editingSection === 'personal'}
          editInput={editingSection === 'personal' ? editInputNode : null}
        />
      </div>
    </div>
  );
}
