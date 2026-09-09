# Chronicle // Agentic Cinema Continuity Engine

**Canonical Repository**: `specimba/chronicle-revision`  
**Published Application**: `chronicle-revision.ai.studio`  
**Target Track**: Agentic Cinema — ClickHouse  
**Runtime**: Next.js 15+ (App Router) on Google Cloud Run (Port 3000)

---

## 1. Executive Architecture Summary

Chronicle is an **Agentic Cinema Continuity Engine** designed for editorial and VFX supervisor suites. In high-budget long-form cinematic productions, a localized director change (such as altering Scene 12 from a night deluge storm into a sunrise dawn) triggers cascading multi-department ruptures across dialogue intelligibility, wardrobe moisture continuity, editorial tempo, score motifs, and character knowledge chronologies.

Chronicle provides strict, cryptographic ledger integrity by enforcing a **strict separation of concerns**:
- **Agent Discovery (Read-Only)**: The agent, powered by `@google/adk` and `gemini-3.8-flash`, connects to an official `mcp-clickhouse` server over **Streamable HTTP** (`MCPToolset`). It executes bounded 3-hop breadth-first searches (H0 -> H1 -> H2 -> H3 Stop) strictly under read-only permissions to discover factual dependencies and invariant conflicts.
- **Human Promotion (Deterministic Writer)**: The agent has **no write permissions** to ClickHouse. Only an explicit human supervisor promotion action invokes the deterministic server-side promotion route (`/api/chronicle/promote`), which verifies that all locked invariants have an explicit latest `PASS` receipt before committing append-only rows via the direct ClickHouse writer client (`@clickhouse/client`).

```
                    DIRECTOR
                       │
              requests revision
                       │
                       ▼
               GEMINI / ADK
            parses RevisionPatch
                       │
                       ▼
                mcp-clickhouse
                  READ ONLY
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
 current production facts    dependency graph
          │                         │
          └────────────┬────────────┘
                       ▼
                RIPPLE ANALYSIS
                 bounded 3 hops
                       │
                       ▼
                 RepairManifest
                       │
              human / gate review
                       │
                       ▼
                HUMAN PROMOTION
             (Deterministic Route)
                       │
                       ▼
               APPEND-ONLY INSERT
              (Direct Writer Path)
                       │
                       ▼
               REVISION COMMITTED
```

---

## 2. Infrastructure & Environment Configuration

Chronicle runs in Google Cloud Run with an nginx reverse proxy exposing external traffic exclusively on **port 3000**.

### Required Environment Variables

Configure these variables in your environment or Cloud Run container settings (see `.env.example`):

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side | Google Gemini API key used by `@google/adk` and `gemini-3.8-flash`. |
| `CLICKHOUSE_HOST` | Server-side | ClickHouse Cloud endpoint hostname (e.g. `pdxxxxxxxx.eu-central-1.aws.clickhouse.cloud`). |
| `CLICKHOUSE_PORT` | Server-side | ClickHouse native HTTPS port (default: `8443`). |
| `CLICKHOUSE_USER` | Server-side | Scoped writer username (e.g. `default`). |
| `CLICKHOUSE_PASSWORD` | Server-side | Scoped writer password. |
| `CLICKHOUSE_DATABASE` | Server-side | Target ClickHouse database name (default: `default`). |
| `CLICKHOUSE_MCP_URL` | Server-side | URL of the remote official `mcp-clickhouse` server over Streamable HTTP (e.g. `https://mcp-clickhouse.internal:8080/mcp`). |

### Credential Security Invariant

All database credentials, bearer tokens, and Gemini API keys are **strictly server-side**. No credentials or connection secrets are ever exposed to the client browser or included in JSON serialization payloads. Client browsers interact solely through Next.js server API routes (`/api/chronicle/*`).

---

## 3. Subsystem Health States

Chronicle surfaces truthful runtime diagnostics (`/api/chronicle/health`) across six independent subsystems:

1. **WEB_APP**: Next.js App Router server status on Port 3000.
2. **GEMINI**: Orchestration readiness with `gemini-3.8-flash`.
3. **GOOGLE_ADK**: Multi-turn agent loop and tool filtering implementation (`@google/adk`).
4. **MCP**: Remote official `mcp-clickhouse` connection status via `StreamableHTTPConnectionParams`.
5. **CLICKHOUSE**: ClickHouse Cloud canonical database connectivity, latency, and row counts.
6. **WRITER**: Append-only deterministic human promotion identity readiness.

Truthful status values: `NOT_CONFIGURED`, `UNAVAILABLE`, `CONNECTING`, `QUERYING`, `QUERY_FAILED`, `CONNECTED`, `VALIDATION_UNKNOWN`, `VALIDATION_FAILED`, `READY_TO_PROMOTE`, `COMMITTED`.

---

## 4. Verification and Local Development

```bash
# Install dependencies
npm install

# Run type check and linting
npm run lint

# Compile production build
npm run build

# Start local server on Port 3000
npm run dev
```

---

## 5. License

Chronicle is open-source software licensed under the [Apache License, Version 2.0](LICENSE).
