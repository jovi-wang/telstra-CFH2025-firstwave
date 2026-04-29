# AGENTS.md

## Scope

- This repo has no root workspace runner. Work per package:
- `frontend-dashboard/`: Vite + React 19 + TypeScript UI
- `backend-api/`: FastAPI app plus stdio MCP server
- `e2e/`: Playwright tests that boot both apps themselves

## Commands

- Frontend install/dev: `cd frontend-dashboard && npm install && npm run dev`
- Frontend checks: `cd frontend-dashboard && npm run lint && npm run build`
- Backend install: `cd backend-api && uv sync`
- Backend dev: `cd backend-api && .venv/bin/uvicorn app.main:app --reload --port 4000`
- E2E run: `cd e2e && npm install && npm test`
- Single e2e spec: `cd e2e && npx playwright test tests/full-flow.spec.ts`

## Verification

- There is no backend test or lint script in repo config; for backend changes, at minimum start `uvicorn` and hit `/health`.
- For frontend changes, `npm run build` is the real typecheck because it runs `tsc -b` before `vite build`.
- Preferred order for frontend verification: `npm run lint` then `npm run build`.
- Playwright is slow and stateful by design: one worker, no parallelism, headed Chrome, backend/frontend started via Playwright `webServer`.

## Architecture

- Frontend entrypoints are `frontend-dashboard/src/main.tsx` and `src/App.tsx`.
- Chat requests use streaming SSE over `fetch` to `POST /api/chat/message`; event notifications use a separate `EventSource` to `GET /api/events/stream`.
- Dashboard state is split across Zustand stores in `frontend-dashboard/src/store/*`; most UI side effects are coordinated from `AIAssistantChatbot.tsx` tool-result handling, not only from stores.
- Backend entrypoint is `backend-api/app/main.py`; startup connects the MCP client and starts a 30-second background region-device-count broadcaster.
- The MCP server is not a separate service to launch manually in normal dev flow; backend startup spawns it via `.venv/bin/python -m app.services.mcp_server`.

## Repo Quirks

- `frontend-dashboard/src/services/backendAPI.ts` and `eventStreamService.ts` hardcode `http://localhost:4000`; changing backend port requires code updates, not just env changes.
- `backend-api/app/config.py` currently hardcodes AWS credentials and MCP settings. Treat this file as sensitive; do not copy secrets into docs, commits, or logs.
- Current branch is `aws-bedrock-model`. The backend AI system prompt in `backend-api/app/services/ai_agent.py` is bushfire-specific on this branch family; slash commands in `frontend-dashboard/src/utils/slashCommands.ts` are bushfire-specific too.
- `mission complete` is special-cased in `ai_agent.py`: it does not run cleanup tools, emits a `mission_complete` event, and the frontend resets local state after a 2 second delay.
- Some prose docs overstate the system. Trust executable sources first: current MCP tool list lives in `backend-api/app/services/mcp_server.py`, and actual chat/event wiring lives in the frontend services and routers.

## Editing Guidance

- If you change chatbot behavior, inspect both `backend-api/app/services/ai_agent.py` and `frontend-dashboard/src/components/AIAssistantChatbot.tsx`; tool names and payload shapes are coupled across them.
- If you change event names or SSE payloads, update both backend routers and frontend stream parsers/listeners.
- If you change branch/use-case wording, also check slash commands and the hardcoded AI system prompt so bushfire/power-outage language stays consistent.
