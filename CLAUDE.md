# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

With devenv: `dev`, `build`, `start`, `lint` are available as shell commands directly.

## Architecture

FictionGPT is an AI-powered novel creation platform (Chinese language UI) built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. It uses Anthropic's Claude Agent SDK for AI-driven story writing through four sequential phases.

### Four-Phase Workflow

1. **Brainstorm** (`/project/[id]/brainstorm`) — Multi-turn conversational agent builds a Story Canvas (premise, characters, plot points, themes). Persists agent sessions and chat messages.
2. **Outline** (`/project/[id]/outline`) — Single-shot agent generates a chapter-by-chapter outline from the canvas. Chat messages persisted.
3. **Write** (`/project/[id]/write`) — Sequential chapter generation with streaming. Uses a sliding window of last 3 chapter summaries for context continuity. Stateless.
4. **Project Management** (`/`) — Create/list/manage projects with writing style selection.
5. **Auth** — Simple token-based access control via `AUTH_TOKEN` env var. Middleware redirects unauthenticated requests to `/login`.

### Agent Models

| Agent | Model | Rationale |
|---|---|---|
| Brainstorm | `claude-opus-4-6` | Creative ideation needs strongest reasoning |
| Outline | `claude-opus-4-6` | Structural planning needs strong reasoning |
| Writer | `claude-sonnet-4-6` | Long-form prose generation, good balance of quality and speed |

### Key Directories

- `src/lib/agents/` — Agent implementations (brainstorm, outline, writer) as async generators yielding `AgentYield` events
- `src/lib/agents/prompts/` — System prompts (Chinese) and writing style modifiers
- `src/lib/storage/` — File-based persistence (JSON/Markdown) under `/data/projects/{id}/`, including chat message history
- `src/middleware.ts` — Auth middleware; validates `auth_token` cookie against `AUTH_TOKEN` env var
- `src/lib/context/` — Context builder assembles chapter-writing context (story info, characters, prior summaries, unresolved threads)
- `src/lib/types/` — Core data models: `ProjectMeta`, `StoryCanvas`, `Character`, `Outline`, `ChapterSummary`
- `src/hooks/` — `useProject` (data management), `useSSEChat` (streaming conversation)
- `src/components/ui/` — shadcn/ui components
- `src/app/api/` — SSE-streaming API routes for each phase

### Data Flow Pattern

All AI operations follow: API route → create SSE stream → run agent async generator → forward text events to client → parse structured data from XML tags in agent output (`<canvas_update>`, `<outline_json>`, `<chapter_summary>`) → save to file storage → send completion event.

### Storage Structure

```
data/projects/{projectId}/
├── meta.json                  # ProjectMeta
├── canvas.json                # StoryCanvas
├── outline.json               # Outline with ChapterOutline[]
├── brainstorm-messages.json   # Brainstorm chat history
├── outline-messages.json      # Outline chat history
├── chapters/                  # chapter-01.md, chapter-02.md, ...
└── summaries/                 # chapter-01.json, chapter-02.json, ...
```

### Frontend Pattern

Pages use a split-layout: left panel for chat/interaction, right panel for canvas/editor/content. Real-time streaming via SSE with `useSSEChat` hook (brainstorm) or inline fetch+ReadableStream (outline). Markdown rendered with `react-markdown` + `remark-gfm` for GFM table support.

## Conventions

- Environment: `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, and `AUTH_TOKEN` configured in `.env.local`; `src/lib/agents/env.ts` patches `process.env` and returns a plain object for SDK child process spawning to ensure `.env.local` overrides system env vars everywhere
- Path alias: `@/*` maps to `./src/*`
- All user-facing text and agent prompts are in Chinese
- Agents wrap structured output in XML tags for reliable extraction from streaming text
- Writing styles (`literary`, `webnovel`, `mystery`, `scifi`, `fantasy`, `romance`, `custom`) are injected as modifiers into the writer system prompt
- UI components follow shadcn/ui patterns (CVA + tailwind-merge)
