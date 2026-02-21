import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types';
import { isPresetColor } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onToggle: (id: string) => void;
  onClick: (task: Task) => void;
}

export default function TaskCard({ task, index, onToggle, onClick }: TaskCardProps) {
  const isCustom = task.color !== 'none' && !isPresetColor(task.color);
  const hasColor = task.color !== 'none';
  const titleColorClass = hasColor && !isCustom ? `color-bg-${task.color}` : '';
  const titleStyle = isCustom ? { backgroundColor: task.color } : undefined;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card${snapshot.isDragging ? ' dragging' : ''}`}
          style={provided.draggableProps.style}
          onClick={() => onClick(task)}
        >
          <button
            className={`task-checkbox${task.completed ? ' checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {task.completed && <span className="checkmark">✓</span>}
          </button>
          <span
            className={`task-title${task.completed ? ' completed' : ''}${hasColor ? ` task-highlight ${titleColorClass}` : ''}`}
            style={titleStyle}
          >
            {task.title}
          </span>
          {task.recurrence && <span className="task-recurrence-icon" title="Recurring">↻</span>}
        </div>
      )}
    </Draggable>
  );
}
