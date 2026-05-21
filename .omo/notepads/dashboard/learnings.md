# Dashboard Project — Learnings

## Architecture Conventions
- All JS loaded via `<script>` tags in order (NO ES modules)
- Global state: `window.AppState` singleton
- Component interface: `init()` + `update()` only
- XSS rule: NEVER `innerHTML` for user data — always `textContent`
- Locked files after Phase 1: `constants.js`, `mock-data.js`

## Script Load Order (index.html)
constants.js → mock-data.js → app-state.js → agents.js → tasks.js → logs.js → checklist.js → main.js

## CSS Load Order (index.html head)
tokens.css → layout.css → components.css → animations.css

## Key IDs
- #panel-agents, #panel-tasks, #panel-logs, #panel-checklist
- #btn-theme-toggle, #btn-auto-refresh, #refresh-status

## Theme
- Default: dark (`data-theme` NOT set or `dark`)
- Light: `document.documentElement.dataset.theme = 'light'`
