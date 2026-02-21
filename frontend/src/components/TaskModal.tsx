import { useState, useRef } from 'react';
import type { Task, RecurrenceRule, RecurrenceType } from '../types';
import ColorPicker from './ColorPicker';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDeleteFuture: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onSetColor: (id: string, color: Task['color']) => void;
  onSetRecurrence: (id: string, recurrence: RecurrenceRule | null) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TaskModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  onDeleteFuture,
  onToggleComplete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onSetColor,
  onSetRecurrence,
}: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  const isRecurring = !!(task.recurrence || task.recurringParentId);
  const [recType, setRecType] = useState<RecurrenceType>(
    task.recurrence?.type ?? 'daily'
  );
  const [recInterval, setRecInterval] = useState(task.recurrence?.interval ?? 1);
  const [recCount, setRecCount] = useState<number | ''>(task.recurrence?.count ?? '');
  const [recDays, setRecDays] = useState<number[]>(
    task.recurrence?.daysOfWeek ?? []
  );

  const dateRef = useRef<HTMLInputElement>(null);

  const handleTitleBlur = () => {
    if (title !== task.title) onUpdate(task.id, { title });
  };

  const handleNotesBlur = () => {
    if (notes !== task.notes) onUpdate(task.id, { notes });
  };

  const handleAddSubtask = () => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    onAddSubtask(task.id, trimmed);
    setSubtaskInput('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddSubtask();
  };

  const handleSaveRecurrence = () => {
    const rule: RecurrenceRule = { type: recType };
    if (recType === 'custom') {
      rule.interval = recInterval;
      rule.daysOfWeek = recDays.length > 0 ? recDays : undefined;
    }
    if (recCount !== '' && recCount > 0) {
      rule.count = recCount;
    }
    onSetRecurrence(task.id, rule);
    setShowRecurrence(false);
  };

  const handleRemoveRecurrence = () => {
    onSetRecurrence(task.id, null);
    setShowRecurrence(false);
  };

  const toggleDay = (day: number) => {
    setRecDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-date-wrapper">
            <button
              className="modal-date"
              onClick={() => dateRef.current?.showPicker()}
              title="Click to change date"
            >
              {task.date
                ? new Date(task.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Someday'}
            </button>
            <input
              ref={dateRef}
              type="date"
              className="modal-date-input"
              value={task.date ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) onUpdate(task.id, { date: val });
              }}
            />
          </div>
          <div className="modal-header-actions">
            <button
              className="modal-icon-btn"
              onClick={() => setShowRecurrence(!showRecurrence)}
              title="Recurrence"
            >
              ↻
            </button>
            <div className="delete-btn-wrapper">
              <button
                className="modal-icon-btn delete"
                onClick={() => {
                  if (isRecurring) {
                    setShowDeleteOptions((v) => !v);
                  } else {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                title="Delete task"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
              {showDeleteOptions && (
                <div className="delete-options-dropdown">
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      onClose();
                    }}
                  >
                    Delete this task only
                  </button>
                  <button
                    onClick={() => {
                      onDeleteFuture(task.id);
                      onClose();
                    }}
                  >
                    Delete this &amp; all future
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-title-row">
          <input
            className="modal-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />
          {!task.isLabel && (
            <button
              className={`task-checkbox modal-checkbox${task.completed ? ' checked' : ''}`}
              onClick={() => onToggleComplete(task.id)}
            >
              {task.completed && <span className="checkmark">✓</span>}
            </button>
          )}
        </div>

        {task.date && (
          <div className="modal-section">
            <label className="label-toggle">
              <input
                type="checkbox"
                checked={task.isLabel}
                onChange={() => onUpdate(task.id, { isLabel: !task.isLabel })}
              />
              <span className="label-toggle-text">Day label</span>
            </label>
          </div>
        )}

        <div className="modal-section">
          <label className="modal-label">Color</label>
          <ColorPicker selected={task.color} onChange={(c) => onSetColor(task.id, c)} />
        </div>

        <div className="modal-section">
          <label className="modal-label">Notes</label>
          <textarea
            className="modal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add some extra notes here..."
            rows={3}
          />
        </div>

        <div className="modal-section">
          <label className="modal-label">Subtasks</label>
          <ul className="subtask-list">
            {task.subtasks.map((sub) => (
              <li key={sub.id} className="subtask-item">
                <button
                  className={`subtask-checkbox${sub.completed ? ' checked' : ''}`}
                  onClick={() => onToggleSubtask(task.id, sub.id)}
                >
                  {sub.completed && <span className="checkmark">✓</span>}
                </button>
                <span className={sub.completed ? 'completed' : ''}>{sub.title}</span>
                <button
                  className="subtask-delete"
                  onClick={() => onDeleteSubtask(task.id, sub.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="subtask-add">
            <input
              placeholder="Add a subtask..."
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={handleSubtaskKeyDown}
            />
            <button onClick={handleAddSubtask} className="subtask-add-btn">+</button>
          </div>
        </div>

        {showRecurrence && (
          <div className="modal-section recurrence-section">
            <label className="modal-label">Recurrence</label>
            <div className="recurrence-options">
              <select
                value={recType}
                onChange={(e) => setRecType(e.target.value as RecurrenceType)}
                className="rec-select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>

              {recType === 'custom' && (
                <div className="rec-custom">
                  <div className="rec-interval">
                    <label>Every</label>
                    <input
                      type="number"
                      min={1}
                      value={recInterval}
                      onChange={(e) => setRecInterval(Number(e.target.value))}
                      className="rec-interval-input"
                    />
                    <span>day(s)</span>
                  </div>
                  <div className="rec-days">
                    <label>On days:</label>
                    <div className="rec-day-buttons">
                      {DAYS_OF_WEEK.map((name, i) => (
                        <button
                          key={i}
                          className={`rec-day-btn${recDays.includes(i) ? ' active' : ''}`}
                          onClick={() => toggleDay(i)}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="rec-stop-after">
                <label>Stop after</label>
                <input
                  type="number"
                  min={1}
                  placeholder="∞"
                  value={recCount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRecCount(v === '' ? '' : Math.max(1, Number(v)));
                  }}
                  className="rec-count-input"
                />
                <span>time(s)</span>
              </div>

              <div className="rec-actions">
                <button className="rec-save-btn" onClick={handleSaveRecurrence}>
                  Save
                </button>
                {task.recurrence && (
                  <button className="rec-remove-btn" onClick={handleRemoveRecurrence}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
