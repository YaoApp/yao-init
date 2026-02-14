---
name: yao-agent-development
description: Guide for building AI Agents with Yao framework. Use when creating assistants, implementing hooks (Create/Next), defining MCP tools, database models, prompts, i18n, agent-to-agent communication (A2A), or working with the Context API. Trigger when user mentions Yao Agent, assistant development, hooks, MCP tools, or agent pipelines.
metadata:
  author: Yao App Engine
  version: "1.0"
---

# Yao Agent Development Guide

Build AI Agents (Assistants) with hooks, tools, models, and prompts.

## Core Concept

```
Assistant = Hooks + Tools + Models + Prompts + Configuration
```

- **Hooks**: TypeScript functions (`Create`, `Next`) that intercept execution
- **Tools**: MCP tool implementations called by LLM
- **Models**: Database schemas with auto-migration
- **Prompts**: System/user prompt templates

## Directory Structure

```
assistants/<assistant_id>/
├── package.yao              # Required: Configuration
├── prompts.yml              # Required: System prompts
├── src/
│   ├── index.ts             # Hooks (Create, Next)
│   ├── tools.ts             # MCP tool implementations
│   └── *_test.ts            # Tests
├── mcps/
│   ├── tools.mcp.yao        # Tool declarations
│   └── mapping/tools/schemes/
│       └── <tool>.in.yao    # Tool input schema
├── models/
│   └── *.mod.yao            # Database models
├── locales/
│   ├── en-us.yml
│   └── zh-cn.yml
└── pages/                   # SUI pages (optional)
```

---

# Package Configuration

**`package.yao`**:

```json
{
  "name": "{{ name }}",
  "type": "assistant",
  "avatar": "/assets/avatar.png",
  "connector": "deepseek.v3",
  "connector_options": {
    "optional": true,
    "connectors": ["deepseek.v3", "openai.gpt-4o"],
    "filters": ["tool_calls"]
  },
  "mcp": {
    "servers": [
      { "server_id": "agents.<id>.tools", "tools": ["tool1"] }
    ]
  },
  "uses": { "search": "disabled" },
  "options": { "temperature": 0.7 },
  "public": true,
  "modes": ["chat", "task"],
  "default_mode": "task",
  "mentionable": true,
  "share": "team",
  "placeholder": {
    "title": "{{ chat.title }}",
    "prompts": ["{{ chat.prompts.0 }}"]
  }
}
```

| Field               | Description                               |
| ------------------- | ----------------------------------------- |
| `connector`         | Default LLM connector ID. Supports `$ENV.VAR` syntax |
| `connector_options` | Connector filtering for CUI switcher (see below) |
| `mcp.servers`       | MCP tools to enable                       |
| `uses.search`       | Search behavior: `"disabled"`, `"builtin"`, `"<agent>"` |
| `modes`             | Supported modes: `"chat"`, `"task"`       |
| `share`             | Sharing: `"user"`, `"team"`, `"public"`   |
| `tags`              | Classification tags for CUI display       |
| `mentionable`       | Whether agent can be @mentioned by others |
| `sort`              | Display order in CUI sidebar              |

**`connector_options` details:**

| Field | Description |
|-------|-------------|
| `optional` | Show connector switcher in CUI (`true`=show, `false`=hide) |
| `connectors` | Whitelist of connectors; empty = show all |
| `filters` | Filter by capability: `"tool_calls"`, `"vision"`, `"reasoning"`, etc. |

---

# Hooks

## Execution Flow

```
User Input → Load History → Create Hook → LLM Call → Tool Execution → Next Hook → Response
```

## Create Hook

Called before LLM call. Configure the request.

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  ctx.memory.context.Set("start_time", Date.now());
  
  return null;  // Default behavior
  
  // Or return configuration overrides
  return {
    messages, temperature: 0.7, connector: "gpt-4o", prompt_preset: "task",
    mcp_servers: [{ server_id: "agents.myapp.tools" }],
    uses: { search: "disabled" },
  };
  
  // Or delegate to another agent
  return { delegate: { agent_id: "specialist", messages } };
}
```

## Next Hook

Called after LLM response and tool calls.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools, error } = payload;
  if (error) return { data: { status: "error", message: error } };
  
  if (tools?.length > 0) {
    if (tools[0].result?.intent === "query") {
      return { delegate: { agent_id: "query_agent", messages: payload.messages } };
    }
    return { data: { status: "success", results: tools.map(t => t.result) } };
  }
  return null;  // Standard LLM response
}
```

### Return Values

| Return Value         | Behavior                          |
| -------------------- | --------------------------------- |
| `{ data: {...} }`    | Return custom data, ends execution |
| `{ delegate: {...} }`| Delegate to agent, continues      |
| `null`               | Standard response, ends execution |

---

# Context API

## Properties

```typescript
ctx.chat_id          // Chat session ID
ctx.assistant_id     // Assistant identifier
ctx.locale           // User locale
ctx.authorized       // { user_id, team_id, constraints }
```

## Get Owner ID

```typescript
const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
```

## Messaging

```typescript
// Complete message
ctx.Send({ type: "text", props: { content: "Hello!" } });
ctx.Send("Hello!");

// Streaming
const id = ctx.SendStream("Processing...");
ctx.Append(id, " done!");
ctx.End(id);

// Replace/Update
ctx.Replace(id, { type: "text", props: { content: "Done!" } });
```

## Memory

| Namespace            | Persistence | Use Case                |
| -------------------- | ----------- | ----------------------- |
| `ctx.memory.user`    | Persistent  | User preferences        |
| `ctx.memory.team`    | Persistent  | Team settings           |
| `ctx.memory.chat`    | Persistent  | Chat session state      |
| `ctx.memory.context` | Request     | Pass data between hooks |

```typescript
ctx.memory.context.Set("key", value);
ctx.memory.context.Set("key", value, 300);  // With TTL
const value = ctx.memory.context.Get("key");
```

## MCP

```typescript
const result = ctx.mcp.CallTool("server_id", "tool_name", { arg: "value" });
```

See [Context API Reference](references/context-api.md) for Trace, MCP parallel calls, memory counters/lists, and full API.

## Agent-to-Agent (A2A)

```typescript
// From hooks — ctx.agent.Call()
const result = ctx.agent.Call("yao.keeper.classify", messages, {
  skip: { output: true, history: true },
});
// result.content, result.error

// From any context (YaoJob, MCP, scripts) — Process
const result = Process("agent.Call", {
  assistant_id: "yao.keeper.classify",
  messages: [{ role: "user", content: "Classify this..." }],
  timeout: 120,  // optional, default 600s
});
```

See [Context API](references/context-api.md) for parallel calls, full parameters, and when to use which.

---

# MCP Tools

## Tool Server (`mcps/tools.mcp.yao`)

```json
{
  "label": "Tools",
  "description": "Custom tools",
  "transport": "process",
  "tools": {
    "recognize": "agents.<id>.tools.Recognize",
    "query": "models.agents.<id>.order.Paginate"
  }
}
```

## Tool Input Schema (`mcps/mapping/tools/schemes/recognize.in.yao`)

```json
{
  "type": "object",
  "description": "Recognize user intent",
  "properties": {
    "intent": {
      "type": "string",
      "enum": ["query", "submit", "analyze"],
      "description": "Detected intent"
    },
    "data": {
      "type": "object",
      "description": "Extracted data"
    }
  },
  "required": ["intent"]
}
```

## Tool Implementation (`src/tools.ts`)

```typescript
// @ts-nocheck
import { agent } from "@yao/runtime";

export function Recognize(params: { intent: string; data: any }, ctx: agent.Context) {
  const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
  switch (params.intent) {
    case "query":
      return { records: Process("models.agents.myapp.order.Get", {
        wheres: [{ column: "__yao_created_by", value: ownerID }], limit: 20,
      })};
    default:
      return { error: "Unknown intent" };
  }
}
```

---

# Models

Models in `models/` are auto-loaded with prefix `agents.<assistant_id>.`:

**`models/order.mod.yao`**:

```json
{
  "name": "Order",
  "table": { "name": "order" },
  "columns": [
    { "name": "id", "type": "ID", "primary": true },
    { "name": "title", "type": "string", "length": 200 },
    { "name": "amount", "type": "decimal", "precision": 10, "scale": 2 },
    { "name": "status", "type": "enum", "option": ["pending", "completed"] }
  ],
  "option": { "timestamps": true, "soft_deletes": true, "permission": true }
}
```

**Usage:** Model ID = `agents.myapp.order`, Table = `agents_myapp_order`

```typescript
Process("models.agents.myapp.order.Get", { limit: 10 });
Process("models.agents.myapp.order.Find", id);
Process("models.agents.myapp.order.Create", { title: "New", amount: 100 });
```

## Permission Columns

When `option.permission: true`, auto-added columns: `__yao_created_by` (user), `__yao_team_id` (team).

```typescript
Process("models.agents.myapp.order.Create", {
  title: "Order",
  __yao_created_by: ctx.authorized.user_id,
  __yao_team_id: ctx.authorized.team_id,
});
```

---

# Prompts

**`prompts.yml`** — system prompt with template variables:

```yaml
- role: system
  content: |
    # Assistant Name
    You are an assistant that helps users with [task].
    Current date: {{ $CTX.date }}
    User locale: {{ $CTX.locale }}
```

**Prompt presets:** Create `prompts/chat.yml`, `prompts/task.yml`, then select in Create hook via `return { prompt_preset: "task" }`.

---

# Locales

`locales/en-us.yml` and `locales/zh-cn.yml` — referenced in `package.yao` via `{{ key }}`:

```yaml
# locales/en-us.yml
name: My Assistant
description: Helps with tasks
chat:
  title: New Chat
  prompts:
    - How can I help?
```

---

# Common Patterns

## Loading Indicator

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  const loadingId = ctx.Send({ type: "loading", props: { message: "Processing..." } });
  ctx.memory.context.Set("loading_id", loadingId);
  return { messages };
}

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const loadingId = ctx.memory.context.Get("loading_id");
  if (loadingId) ctx.Replace(loadingId, { type: "loading", props: { message: "✅ Done", done: true } });
  return null;
}
```

## Multi-Agent Delegation

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  if (payload.tools?.[0]?.result?.intent) {
    return { delegate: { agent_id: `myapp.${payload.tools[0].result.intent}`, messages: payload.messages } };
  }
  return null;
}
```

See [Hooks Patterns](references/hooks-patterns.md) for system init checks, locale detection, A2A patterns, and more.

---

# Testing

Test files: `src/*_test.ts`. Functions must start with `Test` and be exported.

```typescript
export function TestSave(t: testing.T, ctx: agent.Context) {
  const tid = ctx.authorized?.team_id || "team-001";
  const result = Save(tid, { title: "Test " + Date.now(), content: "test" });
  t.assert.True(result.entry_id.length > 0, "should have entry_id");
}
```

```bash
# Script test — run from app root, use ./ for paths
yao agent test -n myapp -i scripts.myapp.store \
  --ctx ./assistants/myapp/tests/ctx.json -v

# Quick E2E test
yao agent test -n myapp -i "Hello" -v
```

**Key rules:** Run from app root. Use `./` prefix for `--ctx` and file paths. `src/` is implicit in script paths. Use `yao-dev` instead of `yao` when developing the engine itself.

See [Testing Reference](references/testing.md) for full CLI flags, assertion API, path resolution, known issues, and patterns.

---

# Quick Reference

## Process Calls

```typescript
// Model operations
Process("models.agents.<id>.<model>.Get", { limit: 10 });
Process("models.agents.<id>.<model>.Find", id);
Process("models.agents.<id>.<model>.Create", data);
Process("models.agents.<id>.<model>.Save", id, data);
Process("models.agents.<id>.<model>.Delete", id);

// A2A (from any context — YaoJob, MCP, scripts)
Process("agent.Call", {
  assistant_id: "target.agent.id",
  messages: [{ role: "user", content: "..." }],
  timeout: 120,  // optional, default 600s
});

// Text processing
Process("text.ExtractJSON", llmOutput);     // Parse JSON from LLM text
Process("text.HTMLToMarkdown", htmlString);  // HTML → Markdown

// Store (cache)
const cache = new Store("__yao.cache");
cache.GetSet("key", (k) => expensiveQuery(k), 60);

// Scripts
Process("scripts.mymodule.MyFunction", arg1, arg2);
```

## File Naming

| File Pattern    | Purpose                 |
| --------------- | ----------------------- |
| `package.yao`   | Assistant configuration |
| `prompts.yml`   | Main system prompts     |
| `*.mcp.yao`     | MCP server declarations |
| `*.mod.yao`     | Model definitions       |
| `*.in.yao`      | Tool input schema       |
| `*_test.ts`     | Test files              |
| `en-us.yml`     | English locale          |
| `zh-cn.yml`     | Chinese locale          |

## Reference Files

For detailed API documentation, see:

- [Context API](references/context-api.md) - Full context object reference
- [Hooks Patterns](references/hooks-patterns.md) - Common hook patterns
- [Runtime API](references/runtime-api.md) - Process, http, FS, Store
- [Testing](references/testing.md) - CLI flags, assertion API, path resolution, patterns
