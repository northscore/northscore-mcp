# Claude Context: NorthScore MCP

> This file is public (checked into a public repo). Keep secrets, keys, private links and personal setup in `CLAUDE.local.md` (gitignored, loaded automatically after this file).

## Project Overview

**What this is**: A publicly-hosted **MCP App** for Canadian sports statistics, deployed on Railway next to the NorthScore API. One server, two faces:

- **MCP server** (tools) → works in Claude Desktop and any MCP client (stdio or HTTP).
- **MCP App** (tools + UI) → renders interactive cards in ChatGPT, Claude web, and other MCP-Apps hosts (UI is progressive enhancement; tools always work even where UI is not supported).

**Status**: Rebuild complete on main. Server now supports all 10 league families (CCAA covers 5 college conferences), 7 tools, dual transport (stdio for local clients, Streamable HTTP with JWT auth for remote), and types generated from the live OpenAPI spec. Deploys to Railway (`mcp.northscore.ca`) on every push to `main`. Next: SDK v2 upgrade (#18), MCP Apps UI (#16), then OAuth before public submission.

**Tech Stack**:

- TypeScript, strict mode
- MCP SDK v1 (`@modelcontextprotocol/sdk` 1.32) — v2 upgrade tracked in #18
- Transports: **stdio** (local) + **Streamable HTTP** (remote/hosted)
- Zod for runtime validation
- Types generated from the live OpenAPI spec

---

## Local Development

The NorthScore API runs locally for debugging.

```
Base URL:  http://localhost:8080/api/v1
API key:   your local API key # header: X-API-KEY (set NORTHSCORE_STATS_API_KEY in .env)
OpenAPI:   http://localhost:8080/api/v1/openapi.json
```

To curl an endpoint directly while debugging:

```bash
curl -s -H "X-API-KEY: $NORTHSCORE_STATS_API_KEY" "http://localhost:8080/api/v1/aggregate/games/pro?start_date=2026-06-09&end_date=2026-06-09" | jq
curl -s -H "X-API-KEY: $NORTHSCORE_STATS_API_KEY" "http://localhost:8080/api/v1/cebl/standings" | jq
```

Required env vars (`.env` — see `.env.example`):

```
NORTHSCORE_STATS_API_KEY=your_local_api_key
NORTHSCORE_API_BASE_URL=http://localhost:8080/api/v1   # prod: https://api.northscore.ca/api/v1 (default)
MCP_ALLOWED_HOSTS=localhost,127.0.0.1   # HTTP only; prod: mcp.northscore.ca,healthcheck.railway.app
MCP_TRANSPORT=stdio       # stdio | http (Streamable HTTP)
HOST=127.0.0.1            # 0.0.0.0 when hosted
PORT=3002
NODE_ENV=development
LOG_LEVEL=info          # debug | info | warn | error
SUPABASE_JWT_SECRET=your_jwt_secret    # Required for HTTP transport only (stdio doesn't need it). Get from Supabase: Settings → API → JWT Secret
```

**Security**: the API key is server-side only. It must never appear in the public UI bundle. The browser UI calls our MCP server; our server calls the NorthScore API.

### Debugging with MCP Inspector

```bash
# stdio
npx @modelcontextprotocol/inspector node dist/index.js
# Streamable HTTP: start the server (pnpm dev:http), then connect the Inspector UI to
npx @modelcontextprotocol/inspector   # → http://localhost:3002/mcp
# /mcp requires `Authorization: Bearer <Supabase JWT>` — add it in the Inspector's auth settings
```

Docs: [Inspector](https://modelcontextprotocol.io/docs/tools/inspector) · [Debugging guide](https://modelcontextprotocol.io/docs/tools/debugging)

### Auth (production, before public submission)

End users will sign into NorthScore to access the MCP server, like other MCP apps. Follow the MCP authorization spec (OAuth 2.1: 401 + `WWW-Authenticate` → Protected Resource Metadata → token with audience validation). Key rules: never accept tokens not issued for this server (no token passthrough), validate audience/scopes on every call, short-lived tokens, never log credentials. Context:

- https://modelcontextprotocol.io/docs/tutorials/security/authorization
- https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices
- https://modelcontextprotocol.io/extensions/auth/oauth-client-credentials (machine-to-machine only — user-facing flows use the standard authorization flow)
- https://developers.openai.com/apps-sdk/guides/security-privacy

### UI design + ChatGPT submission (later phases)

- UI design: use the NorthScore branding design file (internal link — ask the team).
- Submission: https://developers.openai.com/apps-sdk/app-submission-guidelines (requires demo account credentials, privacy policy, verb-based tool names, accurate metadata)

---

## Reference Docs

- **NorthScore OpenAPI**: `http://localhost:8080/api/v1/openapi.json` — source of truth for routes, params, and response schemas. Filter with `jq` (it is large, ~255KB / 147 paths).
- **OpenAI Apps SDK**: https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt
- **MCP Apps overview**: https://modelcontextprotocol.io/extensions/apps/overview — fetch subpages as needed for the UI bridge (`ui/*` JSON-RPC over `postMessage`), resource registration, and `_meta.ui.resourceUri` linking.
- **Local skills**: `create-mcp-app`, `add-app-to-server` (in `.agents/skills/`), `mcp-builder` (in `.claude/skills/`).

---

## NorthScore API

`StandardResponse<T>` wrapper on every endpoint: `{ success, data, error_message, message, request_id, timestamp }`. Unwrap `data`; throw on `!success`.

Response shapes vary by league: some return `T[]`, some `{ [key]: T[] }`, some single objects. Normalize to a consistent shape in the service layer (see `src/services/api/normalizers.ts`).

### League families (10)

| Family | Identifier scheme | Notes |
|---|---|---|
| CEBL | `cebl` | basketball |
| CFL | `cfl` | football |
| CPL | `cpl` | soccer |
| HoopQueens | `hoopqueens` | basketball |
| NSL | `nsl` | women's soccer |
| MWBA | `mwba` | basketball; uses `/schedule` not `/games` |
| CHL | `chl_ohl`, `chl_whl`, `chl_qjmhl` | hockey; path `/chl/{league}/...` |
| U SPORTS | `usports_{mbb,wbb,mvb,wvb,mfb,msoc,wsoc,mhky,whky}` | path `/usports/{sport}/{league}/...` |
| CCAA | `{ocaa,acac,pacwest,acaa,mcac}_{mbb,wbb,mvb,wvb,msoc,wsoc}` | 5 college conferences (OCAA ON, ACAC AB, PACWEST BC, ACAA Atlantic, MCAC MB); path `/{conference}/{sport}/{league}/...` |
| PSL | `psl_{...}` | 14 sub-leagues (ppl/apl/bcpl/opl variants × mens/womens); path `/psl/{league}/...` |

### Aggregate (cross-league, date-range) — for "today / this week / range"

```
GET /aggregate/games/pro       ?start_date=&end_date=    # CFL, CPL, CEBL, CHL, HoopQueens, NSL
GET /aggregate/games/usports   ?start_date=&end_date=
GET /aggregate/games/ccaa      ?start_date=&end_date=    # all 5 CCAA conferences + nationals
```

Returns `StandardResponse<{ [league]: GenericGame[] }>`. Dates are `YYYY-MM-DD`.

---

## MCP Tools (7)

Per-tool league enums — **do not** use one global league list. Each tool's `league_system` enum includes only families the endpoint actually supports, so unsupported leagues never appear as valid options (deterministic). Where a league legitimately lacks a tool, return a clean, actionable error.

### Coverage matrix

| Tool | CEBL | CFL | CPL | HQ | NSL | MWBA | CHL | USPORTS | CCAA | PSL |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| get_games | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| get_games_by_date | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — |
| get_standings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| get_leaderboard | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | — |
| get_team_info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| get_team_stats | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | — |
| get_team_roster | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | — |

### Tool definitions

1. **get_games_by_date** — cross-league games by date. Inputs: `scope` (`pro`|`usports`|`ccaa`), `preset` (`today`|`this_week`) or `start_date`+`end_date`. Backed by `/aggregate/games/{scope}`.
2. **get_games** — single-league schedule/scores. Inputs: `league_system` (all families), optional `team_name`.
3. **get_standings** — all families.
4. **get_leaderboard** — stat leaders. Enum: CEBL, CFL, CPL, HoopQueens, U SPORTS, CCAA only.
5. **get_team_info** — record/division/streak. All families.
6. **get_team_stats** — team statistics. Enum: all except MWBA, PSL.
7. **get_team_roster** — roster. Enum: all except NSL, CHL, PSL.

**Deliberately excluded** (not deterministic — only a few major leagues): box-score, play-by-play, shots, analytics, team-form, transactions, player-compare. May add later behind their own narrow enums.

---

## Architecture

```
/src
  /config      - env + validation
  /constants   - league enums, timeouts, response size limit
  /services
    /api       - client.ts (fetch + StandardResponse unwrap + errors),
                 endpoints.ts (URL builders + league parsing),
                 normalizers.ts (dict→array, single-item extraction)
    *.ts       - one service per domain (games, standings, ...)
  /tools       - one file per MCP tool (Zod schemas + registration)
  /types       - interfaces + enums (generated from OpenAPI where possible)
  /ui          - MCP App UI components (added during UI phase)
```

**Service layer**: `endpoints.ts` `parseLeagueSystem` maps every family (simple, CHL, U SPORTS, CCAA, PSL) to its API base path; team names are `encodeURIComponent`-ed in path URLs. Not yet exposed: U SPORTS `wrug`/`wfh` (API has games only, no standings) and `/aggregate/games/psl`.

---

## UI Components (3, for the App phase)

Built with the `create-mcp-app` skill on the **open MCP Apps standard**: `ui://` resources served via `registerAppResource`, tools linked via `_meta.ui.resourceUri`, UI in a sandboxed iframe talking `ui/*` JSON-RPC over postMessage (`@modelcontextprotocol/ext-apps` `App` class). ChatGPT now implements this same standard — `_meta["openai/outputTemplate"]` / `text/html+skybridge` are legacy. Use `window.openai` extras only behind feature detection.

1. **Scoreboard** — today's / date-range games (from `get_games_by_date`). Highest impact. Compact inline cards (date, opponent, score/status; optional venue or watch link); "Show more" expands to fullscreen for the full schedule.
2. **Standings table** — inline scrollable table (Team | W | L, optional conference/division). Single-team query renders just that team's row.
3. **Leaderboard** — inline top-5 list (Rank | Player | Team | StatValue), no expansion. Normalize stat keys by sport (basketball: points/rebounds…, soccer: goals/assists…).

Possible 4th: **team card** from `get_team_stats` — logo, colours, record, recent form (W-L-W), link to team page on NorthScore.

---

## Commands

```bash
pnpm install
pnpm dev          # hot reload (stdio)
pnpm dev:http     # hot reload (Streamable HTTP on :3002)
pnpm build        # tsc
pnpm start        # run compiled
pnpm type-check
pnpm lint
pnpm format
pnpm test         # unit tests
pnpm gen:types    # regenerate src/types/generated.ts from the OpenAPI spec
# Integration smoke test against the local API (manual, not part of pnpm test):
NORTHSCORE_STATS_API_KEY=<local key> NORTHSCORE_API_BASE_URL=http://localhost:8080/api/v1 pnpm test:integration
```

CI: `.github/workflows/api-types-drift.yml` regenerates types from production weekly and fails on drift. `generated.ts` is in `.prettierignore` so formatting never causes false drift.

---

## Deployment

- **Railway**, same project as the NorthScore API. Calls the API over its **public URL** `https://api.northscore.ca/api/v1`.
- Built from the root `Dockerfile` (Railway auto-detects it). Service settings: `PORT=8080` (domain target port), healthcheck path `/health`, `MCP_ALLOWED_HOSTS=mcp.northscore.ca,healthcheck.railway.app`, region us-east4 (same as the API).
- Secrets (`NORTHSCORE_STATS_API_KEY`, `SUPABASE_JWT_SECRET`) live only in Railway as sealed variables — never in the repo. `NORTHSCORE_API_BASE_URL` can be omitted (defaults to prod).
- Serve over **Streamable HTTP** for remote hosts (ChatGPT/Claude web); keep **stdio** for local clients.
- UI resources served over HTTPS (public); API key server-side only.
