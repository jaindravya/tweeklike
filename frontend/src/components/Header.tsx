import { useState, useRef, useEffect } from 'react';
import type { Theme } from '../themes';

interface HeaderProps {
  title: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  currentTheme: Theme;
  themes: Theme[];
  onSetTheme: (id: string) => void;
}

export default function Header({
  title,
  onPrevWeek,
  onNextWeek,
  currentTheme,
  themes,
  onSetTheme,
}: HeaderProps) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      <div className="header-actions">
        <div className="avatar-wrapper" ref={pickerRef}>
          <div
            className="header-avatar"
            onClick={() => setShowPicker((v) => !v)}
          >
            DJ
          </div>
          {showPicker && (
            <div className="theme-picker">
              <div className="theme-picker-title">Theme</div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  className={`theme-option${t.id === currentTheme.id ? ' active' : ''}`}
                  onClick={() => {
                    onSetTheme(t.id);
                    setShowPicker(false);
                  }}
                >
                  <span
                    className="theme-swatch"
                    style={{ background: t.preview }}
                  />
                  <span
                    className="theme-swatch-accent"
                    style={{ background: t.vars['--primary'] }}
                  />
                  <span className="theme-option-name">{t.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="header-nav-btn" onClick={onPrevWeek} aria-label="Previous week">
          ‹
        </button>
        <button className="header-nav-btn" onClick={onNextWeek} aria-label="Next week">
          ›
        </button>
      </div>
    </header>
  );
}
