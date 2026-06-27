# Roadmap

Future ideas beyond the current rebuild (tools + UI + hosted deployment). Current work is tracked in [CLAUDE.md](CLAUDE.md).

## In-app Northscore assistant — Vercel AI SDK (chosen)

Embed a chat assistant directly in the Northscore app, reusing the same MCP tools as the ChatGPT/Claude integrations — one tool surface, every client.

**Stack**: AI SDK v6 (`ai` + `@ai-sdk/react`), model-agnostic (20+ providers incl. OpenAI, Anthropic, Google), runs in our own Next.js app.

- **Backend**: Next.js route handler creates an MCP client with `createMCPClient` (Streamable HTTP transport from `@modelcontextprotocol/sdk`, pointed at the hosted Northscore MCP server), pulls tools via `await client.tools()`, and passes them to `streamText` with the chosen model. Always `client.close()` in a `finally` block.
- **Frontend**: `useChat` (AI SDK UI) with custom components — reuse the same card/table designs as the MCP App UI. Optional ready-made chat layer: [assistant-ui](https://www.assistant-ui.com/).
- Docs: [AI SDK](https://ai-sdk.dev/docs) · [MCP tools cookbook](https://ai-sdk.dev/cookbook/node/mcp-tools)

### Alternatives considered

- **OpenAI AgentKit (Agent Builder + ChatKit)** — fastest managed path, but locked to OpenAI models and hosted workflows. [ChatKit JS](https://openai.github.io/chatkit-js/) · [Studio](https://chatkit.studio/playground)
- **Claude API MCP connector** — `mcp_servers` param on the Messages API, bring your own UI; only if we standardize on Claude. [Docs](https://docs.anthropic.com/en/docs/agents-and-tools/mcp-connector)
- **CopilotKit** — open-source in-app copilot with MCP support; heavier dependency. [Docs](https://docs.copilotkit.ai/)

## Tools deliberately deferred

Box-score, play-by-play, shots, analytics, team-form, transactions, player-compare — only a few major leagues support them, so they're excluded for determinism. Add later behind their own narrow per-tool league enums (see CLAUDE.md → MCP Tools).
