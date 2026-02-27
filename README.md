# Tweeklike

A weekly planner inspired by [Tweek](https://tweek.so), built with React, FastAPI, and PostgreSQL.

## features

- **weekly calendar view** — mon through fri columns, with sat/sun combined into a compact weekend column
- **academic / personal sections** — each day is split into two sections with a synchronized divider across the week
- **day labels** — pin labels like "exam day" to the top of a column, separate from tasks
- **drag and drop** — move tasks between days and sections freely
- **task details** — click any task to edit title, add notes, subtasks, pick a color, set recurrence, or reassign the date
- **color highlights** — preset and custom hex colors, shown as rounded pills around task text
- **auto-rollover** — unfinished tasks from past days automatically move to today
- **recurring tasks** — daily, weekly, monthly, or custom intervals with optional stop-after count
- **someday section** — a 3-column grid for undated tasks
- **theme picker** — click the avatar to switch between 6 themes (neutral, dusty pink, ocean, forest, lavender, mocha)
- **notebook-style ui** — ruled lines, click-to-add on empty rows, no clutter
- **persistent storage** — all tasks stored in postgresql, survives restarts and browser clears

## prerequisites

you need [docker](https://docs.docker.com/get-docker/) and [docker compose](https://docs.docker.com/compose/install/) installed.

## getting started

1. clone the repo:

```bash
git clone https://github.com/jaindravya/tweeklike.git
cd tweeklike
```

2. create a `.env` file in the project root with your database credentials:

```bash
cp .env.example .env
```

then edit `.env` and fill in your own values for the postgres user, password, database name, and connection url.

3. build and start everything:

```bash
docker compose build
docker compose up -d
```

4. open http://localhost:3000 in your browser.

## useful commands

```bash
docker compose ps          # check container status
docker compose logs -f     # follow all logs
docker compose down        # stop everything
docker compose up -d       # start in background
```

## development (without docker)

if you want to run the frontend dev server with hot reload:

```bash
cd frontend
npm install
npm run dev
```

this starts vite on http://localhost:5173 and proxies `/api` requests to the backend on port 8000. you'll need the backend and database running (via docker or locally) for task persistence to work.

## stack

- **frontend** — [react](https://react.dev) + [typescript](https://www.typescriptlang.org) + [vite](https://vite.dev)
- **backend** — [fastapi](https://fastapi.tiangolo.com) + [sqlalchemy](https://www.sqlalchemy.org)
- **database** — [postgresql](https://www.postgresql.org)
- **drag and drop** — [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)
- **deployment** — docker compose with nginx reverse proxy

## project structure

```
tweeklike/
  frontend/
    src/
      components/    — ui components (header, week view, day column, task card, modal, etc.)
      hooks/         — useTasks (api integration), useTheme (theme switching)
      utils/         — date helpers
      themes.ts      — theme definitions
      types.ts       — typescript interfaces
      App.css        — all styles
  backend/
    app/
      main.py        — fastapi app setup
      models.py      — sqlalchemy orm models (tasks, subtasks)
      schemas.py     — pydantic request/response schemas
      routes.py      — api endpoints
      database.py    — database connection
  docker-compose.yml — orchestrates frontend, backend, and postgres
```

## themes

switch themes from the app by clicking the avatar icon in the top right. to tweak theme colors, edit `themes.ts` (runtime values) and `theme.css` (css fallback reference).
