# Findings

This document captures the cleanup findings from a repo-wide review of:

- `frontend-dashboard/`
- `backend-api/`
- `e2e/`
- root and app Markdown documentation

It includes the concrete review findings plus the broader cleanup plan that came out of the scan.

## Review Findings

### 1. [P2] Location update pipeline ends in console logging

- Files:
  - `frontend-dashboard/src/services/eventStreamService.ts:80-85`
  - `backend-api/app/main.py:14-59`
  - `frontend-dashboard/src/components/TelemetryPanel.tsx:6-115`
- Summary:
  The `location_update` SSE path is currently dead-end plumbing.
- Details:
  The backend publishes `location_update` events continuously, but the frontend listener only parses and logs them. It never updates app state, and the telemetry UI still renders static data. Either wire this event into a store consumed by the dashboard, or remove the publisher, event type, and listener together.

### 2. [P3] Trim unreferenced chat store methods

- File:
  - `frontend-dashboard/src/store/chatStore.ts:23-25`
- Summary:
  `updateLastMessage` and `setMessages` are declared and implemented but unused.
- Details:
  They are not selected from `useChatStore` anywhere else in `src`. They add store surface area without a caller and are good cleanup candidates unless they are intentionally reserved for upcoming work.

### 3. [P3] Remove unused subscription selectors

- File:
  - `frontend-dashboard/src/store/subscriptionsStore.ts:28-29`
- Summary:
  `getSubscriptionById` and `hasGeofencingSubscription` are implemented but unused.
- Details:
  There are no in-repo callers. Removing them would simplify the store API and make the active subscription flow easier to scan.

### 4. [P3] Drop unused Playwright page-object helpers

- File:
  - `e2e/fixtures/app.fixture.ts:10-18`
- Summary:
  The Playwright page object carries unused locators and helper methods.
- Details:
  `sendButton`, `chatMessages`, `expectLastResponseToContain`, and `expectMapElementVisible` are not used by the current spec. Trimming them will make the fixture less misleading and easier to maintain as the e2e suite grows.

### 5. [P3] Remove unused axios dependency

- File:
  - `frontend-dashboard/package.json:13`
- Summary:
  `axios` is declared but unused.
- Details:
  The frontend service layer uses native `fetch`, and there are no source imports of `axios` in the repo. Keeping it in `dependencies` and the lockfile only adds install weight and implies an abstraction the app no longer uses.

### 6. [P3] Prune unreferenced backend helper methods

- File:
  - `backend-api/app/services/ai_agent.py:428-440`
- Summary:
  Admin-style helper accessors are present but unused.
- Details:
  `get_conversation` and `list_conversations` are not referenced by any route or service in the repo. If they are not part of an external debugging workflow, removing them would reduce backend API surface and make the class responsibilities clearer.

## Additional Findings

### 7. [P2] Dormant settings in `backend-api/app/config.py`

- File:
  - `backend-api/app/config.py:4-26`
- Summary:
  Several config values are defined but do not currently drive backend runtime behavior.
- Details:
  `PORT`, `HOST`, `DEFAULT_DRONE_ID`, `DEFAULT_PHONE_NUMBER`, `DEFAULT_INCIDENT_LAT`, and `DEFAULT_INCIDENT_LON` are defined in settings but are not referenced by the backend runtime. `PORT` and `HOST` are still referenced in `backend-api/README.md`, so the right cleanup is: either wire them into startup, or remove them and update the docs at the same time.

### 8. [P3] Additional frontend store and service cleanup candidates

- Files:
  - `frontend-dashboard/src/store/mapStore.ts:24,43`
  - `frontend-dashboard/src/store/systemStatusStore.ts:29,59`
  - `frontend-dashboard/src/services/eventStreamService.ts:148-169`
- Summary:
  A few more frontend APIs appear unused in-repo, with different confidence levels.
- Details:
  `disconnect`, `getConnectionStatus`, and `reconnect` in `eventStreamService.ts` appear unused with high confidence. `setMapCenter` and `setEmergencyMode` also appear unused in-repo, but because they are public store APIs, they should be treated as cleanup candidates rather than proven dead code.

### 9. [P3] Additional unused backend helpers and imports

- Files:
  - `backend-api/app/services/mcp_client.py:141-143`
  - `backend-api/app/routers/chat.py:1`
  - `backend-api/app/routers/events.py:1`
- Summary:
  There is some backend dead surface outside `ai_agent.py`.
- Details:
  `get_tool_names` in `mcp_client.py` is unreferenced. `HTTPException` and `Request` in `chat.py`, and `HTTPException` in `events.py`, appear unused and can be removed.

### 10. [P3] Empty placeholder file in e2e area

- File:
  - `e2e-demo-flow.md`
- Summary:
  The file exists but is empty.
- Details:
  `e2e-demo-flow.md` is currently a 0-byte placeholder. Either fill it with the intended test/demo flow or delete it to avoid confusion.

### 11. [P3] Unused starter asset and default Vite favicon

- Files:
  - `frontend-dashboard/src/assets/react.svg`
  - `frontend-dashboard/index.html:5`
- Summary:
  Starter-template leftovers are still present.
- Details:
  `react.svg` is unreferenced, and `index.html` still points at the default `/vite.svg` favicon. These are safe cleanup items.

### 12. [P2] Frontend README no longer matches the codebase

- File:
  - `frontend-dashboard/README.md:34-91`
- Summary:
  This README describes components and features that do not exist in the current app.
- Details:
  It references directories and components such as `src/components/Map/`, `DeviceCountHeatmap.tsx`, `Geofencing.tsx`, `DroneTrail.tsx`, `HeatSignatures.tsx`, mission timer, emergency stop button, and suggested action buttons. It reads like implementation documentation, so the drift is misleading rather than harmless.

### 13. [P2] Agent instruction docs reference missing files

- Files:
  - `CLAUDE.md:748-758`
  - `AGENTS.md:748-758`
- Summary:
  Both instruction files point to reference docs that are not in the repo.
- Details:
  These references currently point to:
  - `architecture_overview.md`
  - `api_integration_guide.md`
  - `dashboard_components.md`
  - `implementation_checklist.md`
  - `mock_data_spec.md`
  - `quick_reference.md`
  - `disaster_response_sequence.mermaid`

  Future agents will waste time looking for files that are not present.

### 14. [P2] Rubrics doc mixes shipped behavior with aspirational architecture

- File:
  - `Rubrics.md:232-245`
- Summary:
  This section overstates implemented engineering practices.
- Details:
  It claims or implies current use of Prettier, unit tests, integration tests, structured observability, multi-drone UI architecture, Gunicorn, Redis pub/sub, and TimescaleDB-backed scaling paths that are not present in the repo today. If this file is a pitch artifact, it should be labeled as such.

### 15. [P2] Root README has a few current-state mismatches

- File:
  - `README.md`
- Summary:
  The root README is mostly useful, but some details have drifted.
- Details:
  Examples:
  - It states "15 CAMARA network APIs" while the implementation is described elsewhere as 14 MCP tools.
  - It describes some UI outcomes, like integrity status flows, that are more static/demo-driven than runtime-driven.
  - It should be reviewed after the dead-code cleanup so the repo has one accurate technical entry point.

## Cleanup Plan

### Phase 1: Config and dead-code cleanup

1. Either wire the dormant settings in `backend-api/app/config.py` into runtime or remove them:
   - `PORT`
   - `HOST`
   - `DEFAULT_DRONE_ID`
   - `DEFAULT_PHONE_NUMBER`
   - `DEFAULT_INCIDENT_LAT`
   - `DEFAULT_INCIDENT_LON`
2. If any of those settings are removed, update `backend-api/README.md` in the same pass so config and docs do not drift further.

### Phase 2: Remove obvious dead code and dead dependencies

1. Remove unused frontend store methods and selectors:
   - `chatStore.updateLastMessage`
   - `chatStore.setMessages`
   - `subscriptionsStore.getSubscriptionById`
   - `subscriptionsStore.hasGeofencingSubscription`
   - `mapStore.setMapCenter`
   - `systemStatusStore.setEmergencyMode`
2. Remove unused service methods:
   - `eventStreamService.disconnect`
   - `eventStreamService.getConnectionStatus`
   - `eventStreamService.reconnect`
3. Remove unused backend helpers:
   - `ai_agent.get_conversation`
   - `ai_agent.list_conversations`
   - `mcp_client.get_tool_names`
4. Remove unused imports in backend routers.
5. Remove `axios` from `frontend-dashboard/package.json` and update the lockfile.
6. Remove `frontend-dashboard/src/assets/react.svg` if it is still unreferenced.
7. Delete or fill in `e2e-demo-flow.md`.
8. Trim dead members from `e2e/fixtures/app.fixture.ts`.

### Phase 3: Resolve the dead `location_update` path

Choose one of these and do it consistently:

1. Wire `location_update` into real state:
   - Add a store for live location updates or extend an existing one.
   - Feed that state into `TelemetryPanel` and any map consumer that should reflect live movement.
   - Remove the remaining static telemetry assumptions that conflict with live SSE data.

2. Remove the feature for now:
   - Delete the backend publisher in `backend-api/app/main.py`.
   - Remove `location_update` from SSE event handling and types.
   - Update docs so they no longer imply live location telemetry.

The repo is currently halfway between these two options.

### Phase 4: Documentation cleanup

1. Rewrite `frontend-dashboard/README.md` so it matches the current component structure and actual behavior.
2. Update `README.md` after code cleanup so it stays the source of truth for setup and architecture.
3. Remove or replace missing reference-doc links in `CLAUDE.md` and `AGENTS.md`.
4. Split docs into two maintained categories:
   - current technical documentation
   - pitch / hackathon / future-state artifacts
5. For technical docs, align them with shipped behavior.
6. For pitch artifacts, prefer scope clarification and explicit labeling over line-by-line matching to runtime code:
   - `Rubrics.md`
   - `business_strategy.md`
   - `presentation.md`

### Phase 5: Add guardrails

1. Keep `frontend-dashboard` TypeScript strict unused checks enabled.
2. Keep the `e2e` TypeScript unused checks as a quick smoke test.
3. Add a backend lint pass for unused imports and locals once Ruff or an equivalent tool is available in the environment.
4. Consider a lightweight doc audit checklist whenever feature work changes architecture or component structure.

## Verification Notes

- `frontend-dashboard` build passes.
- `frontend-dashboard` lint currently fails on `no-explicit-any`, not on unused code.
- An explicit command-line `e2e` TypeScript check passed with `--noUnusedLocals --noUnusedParameters`; those options are not enabled by default in `e2e/tsconfig.json`.
- Ruff was not available in the current environment, so backend unused-code checks were based on direct reference scanning rather than a Python linter.
