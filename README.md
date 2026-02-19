# Northscore MCP Server

> **This is an early demo/prototype.** The server is functional but still under active development.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
<a href="https://modelcontextprotocol.io/clients" target="_blank"><img src="https://badge.mcpx.dev/?type=server" /></a>

MCP (Model Context Protocol) server for [**Northscore**](https://www.northscore.ca).

![Demo: Northscore MCP in Claude Code](assets/northscore_mcp_v0_demo.gif)

*Demo showing Claude Code using the Northscore MCP — fetching league standings, then following up to get the top scorer using the same conversation context.*

Built with TypeScript following [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) and [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) standards.

## Overview

The Northscore MCP Server is designed to enable AI agents to query Northscore's sports data securely.

## Documentation

To understand how to go about researching how to make an MCP server that's compatible with the ChatGPT Apps SDK, AgentKit and ChatKit, please refer to the documentation in the `docs` folder.

- [Concepts](./docs/concepts.md)
- [Plan](./docs/plan.md)
- [Build](./docs/build.md)
- [Deploy](./docs/deploy.md)
- [Guides](./docs/guides.md)
- [Northscore MCP Tools](./docs/northscore-mcp-tools.md)
- [Building a Standalone In-App Assistant](./docs/in-app-assistant.md)

## Prerequisites

- Node.js >= 22.17.0
- **pnpm** >= 10.0.0 ([Installation Guide](https://pnpm.io/installation))
- TypeScript >= 5.0.0

This project uses `pnpm` as the package manager.

## Quick Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Northscore API key:

   ```env
   NORTHSCORE_STATS_API_KEY=your_api_key_here
   ```

3. **Run the server:**
   ```bash
   pnpm dev
   ```

## Development

```bash
pnpm dev          # Run with hot reload
pnpm build        # Compile TypeScript
pnpm start        # Run compiled version
pnpm type-check   # Type checking
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## References

- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
