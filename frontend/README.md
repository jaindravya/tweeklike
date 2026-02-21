# Tweeklike

A weekly planner inspired by [Tweek](https://tweek.so), built with React + TypeScript + Vite.

## features

- **weekly calendar view** — mon through fri columns, with sat/sun combined into a compact weekend column
- **academic / personal sections** — each day is split into two sections with a synchronized divider across the week
- **day labels** — pin labels like "exam day" to the top of a column, separate from tasks
- **drag and drop** — move tasks between days and sections freely
- **task details** — click any task to edit title, add notes, subtasks, pick a color, set recurrence, or reassign the date
- **color highlights** — preset and custom hex colors, shown as rounded pills around task text
- **auto-rollover** — unfinished tasks from past days automatically move to today
- **recurring tasks** — daily, weekly, monthly, or custom intervals
- **someday section** — a 3-column grid for undated tasks
- **theme picker** — click the avatar to switch between 6 themes (neutral, dusty pink, ocean, forest, lavender, mocha)
- **notebook-style ui** — ruled lines, click-to-add on empty rows, no clutter

## getting started

```bash
npm install
npm run dev
```

open http://localhost:5173 in your browser.

## stack

- [react](https://react.dev) + [typescript](https://www.typescriptlang.org)
- [vite](https://vite.dev) for dev server and bundling
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) for drag and drop
- css custom properties for theming
- css subgrid for synchronized layout
- localstorage for task persistence (database integration coming soon)

## project structure

```
frontend/
  src/
    components/    — ui components (header, week view, day column, task card, modal, etc.)
    hooks/         — useTasks (state management), useTheme (theme switching)
    utils/         — date helpers
    themes.ts      — theme definitions
    theme.css      — theme variable reference
    types.ts       — typescript interfaces
    App.css        — all styles
```

## themes

switch themes from the app by clicking the avatar icon in the top right. to tweak theme colors, edit `themes.ts` (runtime values) and `theme.css` (css fallback reference).
