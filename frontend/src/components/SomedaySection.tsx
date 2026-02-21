import { useState, useRef, useMemo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { Task } from '../types';
import TaskCard from './TaskCard';

const COLUMNS = 3;
const MIN_LINES_PER_COL = 6;

interface SomedaySectionProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onClickTask: (task: Task) => void;
  onAddTask: (title: string) => void;
}

export default function SomedaySection({
  tasks,
  onToggle,
  onClickTask,
  onAddTask,
}: SomedaySectionProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const columns = useMemo(() => {
    const cols: Task[][] = Array.from({ length: COLUMNS }, () => []);
    tasks.forEach((task, i) => {
      cols[i % COLUMNS].push(task);
    });
    return cols;
  }, [tasks]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      onAddTask(input.trim());
      setInput('');
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setInput('');
    }
  };

  const handleBlur = () => {
    if (input.trim()) {
      onAddTask(input.trim());
    }
    setInput('');
    setEditing(false);
  };

  const handleEmptyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.task-card')) return;
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="someday-section">
      <h2 className="someday-title">Someday</h2>
      <Droppable droppableId="someday">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`someday-grid${snapshot.isDraggingOver ? ' drag-over' : ''}`}
            onClick={handleEmptyClick}
          >
            {columns.map((colTasks, colIdx) => {
              const emptyLines = Math.max(
                0,
                MIN_LINES_PER_COL - colTasks.length - (colIdx === 0 && editing ? 1 : 0)
              );
              return (
                <div key={colIdx} className="someday-column">
                  {colTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={colIdx + index * COLUMNS}
                      onToggle={onToggle}
                      onClick={onClickTask}
                    />
                  ))}
                  {colIdx === 0 && editing && (
                    <div className="notebook-line">
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
                  )}
                  {Array.from({ length: emptyLines }, (_, i) => (
                    <div key={`line-${i}`} className="notebook-line empty" />
                  ))}
                </div>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
