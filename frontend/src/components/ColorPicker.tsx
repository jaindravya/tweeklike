import { useRef } from 'react';
import type { TaskColor } from '../types';
import { isPresetColor } from '../types';

const PRESETS: { value: TaskColor; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'orange', label: 'Orange' },
];

interface ColorPickerProps {
  selected: TaskColor;
  onChange: (color: TaskColor) => void;
}

export default function ColorPicker({ selected, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustomSelected = !isPresetColor(selected);

  return (
    <div className="color-picker">
      {PRESETS.map((c) => (
        <button
          key={c.value}
          className={`color-swatch color-${c.value}${selected === c.value ? ' selected' : ''}`}
          onClick={() => onChange(c.value)}
          aria-label={c.label}
          title={c.label}
        />
      ))}
      <button
        className={`color-swatch color-custom${isCustomSelected ? ' selected' : ''}`}
        onClick={() => inputRef.current?.click()}
        aria-label="Custom color"
        title="Custom color"
        style={isCustomSelected ? { backgroundColor: selected } : undefined}
      />
      <input
        ref={inputRef}
        type="color"
        className="color-input-hidden"
        value={isCustomSelected ? selected : '#888888'}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
