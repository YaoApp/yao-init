# Yao Agent Architecture — Developer Reference

> Runtime mechanics of Yao Agents (Assistants): connector selection, capabilities, uses system, and tool calling.

---

## 1. package.yao Core Fields

```json
{
  "name": "{{ name }}",
  "type": "assistant",
  "connector": "moonshot.kimi-k2_5-code",
  "connector_options": { "filters": ["tool_calls"] },
  "options": { "temperature": 0.7 },
  "uses": { "search": "disabled" },
  "modes": ["chat", "task"],
  "default_mode": "chat",
  "mcp": { "servers": [{ "server_id": "...", "tools": ["..."] }] },
  "tags": ["Data", "Knowledge"],
  "public": true,
  "mentionable": true,
  "sort": 14
}
```

| Field | Description |
|-------|-------------|
| `connector` | Default LLM connector ID (e.g. `moonshot.kimi-k2_5-code`). Supports `$ENV.VAR` syntax |
| `connector_options` | Filtering options for user connector switching in CUI (see below) |
| `options` | LLM parameters (temperature, etc.) |
| `uses` | Capability routing (search/vision/audio, see below) |
| `modes` | Supported interaction modes: `chat`, `task` |
| `mcp` | MCP server and tool bindings |
| `tags` | Classification tags for CUI display |

---

## 2. Connector Resolution

### Resolution Flow

```
package.yao "connector" field
       │
       ▼
  assistant.Connector (resolves $ENV.* at load time)
       │
       ▼
  GetConnector(ctx, opts)
       │
       ├── opts.Connector set? → use opts value (runtime override)
       └── otherwise → use assistant.Connector
       │
       ▼
  connector.Select(id) → fetch connector instance from global registry
```

**Priority:** `opts.Connector` (from Create Hook / caller) > `assistant.Connector` (package.yao)

### Connector Definition

Connectors are defined in `.conn.yao` files under `connectors/`:

```json
{
  "label": "Moonshot Kimi K2.5 Code",
  "type": "anthropic",
  "options": {
    "model": "kimi-k2.5",
    "key": "$ENV.KIMI_CODE_API_KEY",
    "host": "$ENV.KIMI_CODE_PROXY",
    "capabilities": {
      "tool_calls": true,
      "vision": "openai"
    }
  }
}
```

`type` determines which adapter is used: `openai`, `anthropic`, etc.

---

## 3. connector_options (Connector Filtering)

Controls which connectors are available to users in the CUI connector switcher:

```json
"connector_options": {
  "optional": true,
  "connectors": ["gpt-4o", "claude-3"],
  "filters": ["tool_calls", "vision"]
}
```

| Field | Description |
|-------|-------------|
| `optional` | Whether to show the connector switcher in CUI (`true` = show, `false` = hide, unset = default) |
| `connectors` | Whitelist — only show these connectors; empty = show all |
| `filters` | Filter by capability, AND logic (all conditions must match) |

### Available Filter Values

Corresponds to the `GET /llm/providers?filters=tool_calls,vision` API:

| Filter | Description |
|--------|-------------|
| `tool_calls` | Supports tool/function calling |
| `vision` | Supports image input |
| `audio` | Supports audio input/output |
| `reasoning` | Supports reasoning mode (o1, DeepSeek R1) |
| `streaming` | Supports streaming responses |
| `json` | Supports JSON mode |
| `multimodal` | Supports multimodal input |
| `temperature_adjustable` | Supports temperature adjustment |

---

## 4. Capabilities

### Source Priority

1. `agent/models.yml` (connector ID → capabilities mapping)
2. Connector `.conn.yao` `options.capabilities`
3. Connector adapter defaults

### Capabilities Struct

```go
type Capabilities struct {
    Vision                interface{}  // bool or string ("openai", "claude")
    Audio                 bool
    ToolCalls             bool         // Tool/function calling
    Reasoning             bool         // Reasoning mode
    Streaming             bool         // Streaming responses
    JSON                  bool         // JSON mode
    Multimodal            bool         // Multimodal input
    TemperatureAdjustable bool         // Temperature adjustable
}
```

### Impact of tool_calls

- `ToolCalls == true`: MCP tools and LLM tool calls are passed through to the model normally
- `ToolCalls == false`: `ToolCallAdapter` strips all tools and tool_choice before sending; the model receives no tool definitions

**Key point:** Keeper relies on MCP tools (store, webfetch, media, etc.), so its connector must support `tool_calls`. This is why `connector_options.filters: ["tool_calls"]` is set.

---

## 5. Uses System (Capability Routing)

`uses` controls how the agent invokes auxiliary capabilities during conversations:

```json
"uses": {
  "search": "disabled",
  "vision": "",
  "audio": "",
  "fetch": ""
}
```

### Fields and Value Formats

| Field | Description | Value format |
|-------|-------------|--------------|
| `search` | Auto search | `"disabled"` / `"builtin"` / `"<assistant-id>"` / `"mcp:<server>.<tool>"` |
| `vision` | Image processing | Same as above |
| `audio` | Audio processing | Same as above |
| `fetch` | Content retrieval | Same as above |
| `web` | Web search | Same as above |
| `keyword` | Keyword extraction | Same as above |
| `querydsl` | QueryDSL generation | Same as above |
| `rerank` | Result reranking | Same as above |

### uses.search in Detail

| Value | Behavior |
|-------|----------|
| `"disabled"` | No auto search |
| `""` or unset | Falls back to global config (agent.yml); no config = no search |
| `"builtin"` | Built-in search pipeline: needsearch → keyword → querydsl → rerank |
| `"<assistant-id>"` | Delegate search to the specified assistant |
| `"mcp:<server>.<tool>"` | Use an MCP tool for search |

### Merge Priority

```
Create Hook response Uses  >  runtime opts.Uses  >  package.yao uses  >  global agent.yml uses
```

---

## 6. System Agents

Yao includes built-in system agents configured via `agent.yml`:

| Agent | Purpose |
|-------|---------|
| `__yao.needsearch` | Determine whether search is needed (intent detection) |
| `__yao.keyword` | Extract search keywords from user messages |
| `__yao.querydsl` | Generate database query DSL |
| `__yao.title` | Auto-generate conversation titles |

Each system agent can have its own connector; defaults to `system.default` in `agent.yml`.

---

## 7. Agent-to-Agent Calls (A2A)

Yao supports two mechanisms for agent-to-agent calls, depending on the execution context.

### 7.1 `ctx.agent.Call()` — From Agent Hooks (JSAPI)

Available inside agent hooks (`Create`, `Next`) where an `agent.Context` already exists:

```typescript
export function Create(ctx: agent.Context): agent.CreateResponse {
  const result = ctx.agent.Call("yao.keeper.classify", {
    messages: [{ role: "user", content: "Classify this content..." }],
    options: {
      skip: { output: true, history: true },
      metadata: { source: "keeper" },
    },
  });
  // result.content  — LLM text response
  // result.response — full Response object (including hooks data)
  // result.error    — error string if failed
}
```

### 7.2 `Process("agent.Call")` — From Any Context (Process API)

For contexts **without** `agent.Context` — YaoJob async tasks, Process Handlers, MCP Adapters, scheduled scripts, etc.

```typescript
const result = Process("agent.Call", {
  assistant_id: "yao.keeper.classify",
  messages: [{ role: "user", content: "Classify this content..." }],
  model: "deepseek.v3",        // optional: connector ID override
  timeout: 120,                 // optional: timeout in seconds (default: 600)
  metadata: { source: "job" },  // optional: passed to hooks
  locale: "zh-CN",              // optional
  chat_id: "custom-id",         // optional: auto-generated if empty
});

// result.agent_id  — target assistant ID
// result.content   — LLM text response
// result.response  — full Response object
// result.error     — error string if failed
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assistant_id` | string | Yes | Target assistant ID (fully qualified, e.g. `yao.keeper.classify`) |
| `messages` | array | Yes | Message list (OpenAI format: `[{role, content}]`) |
| `model` | string | No | Connector ID override (e.g. `deepseek.v3`, `gpt-4o`) |
| `timeout` | int | No | Timeout in seconds. Default: **600** (10 minutes) |
| `skip` | object | No | Skip config (`output`, `history`, `trace`). `output` and `history` are **always forced true** |
| `metadata` | object | No | Custom metadata passed to agent hooks |
| `locale` | string | No | Locale string (e.g. `zh-CN`, `en-US`) |
| `route` | string | No | Route path for context |
| `chat_id` | string | No | Chat session ID. Auto-generated if empty |

### Return Value (`Result`)

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | string | The assistant ID that was called |
| `content` | string | Extracted text content from LLM completion |
| `response` | object | Full `Response` object (includes `completion`, `next` hook data, etc.) |
| `error` | string | Error message if the call failed (empty on success) |

### Key Behaviors

- **Headless context**: Creates an `agent.Context` without HTTP dependencies (no Writer, no Interrupt Controller)
- **Forced skip**: `skip.output` and `skip.history` are always `true` — no SSE streaming, no chat history saved
- **Authorization auto-injection**: `team_id`, `user_id` etc. are automatically obtained from the process execution context
- **Timeout management**: `agent.Call` manages its own timeout via `context.WithTimeout`. Default 600s (10 min). The effective timeout is `min(caller_context_timeout, agent_call_timeout)`
- **Error handling**: Agent loading errors and LLM errors are returned in `result.error` (not thrown). Parameter validation errors (`assistant_id` missing, etc.) throw immediately via `exception`

### Timeout Layering

```
Caller context (YaoJob timeout / Go test / TS unlimited)
  └─ agent.Call timeout (default 600s, override via `timeout` field)
       └─ context.WithTimeout takes the shorter of the two
            └─ agent.Stream execution
```

### Usage in YaoJob

```typescript
// In a Job handler — no agent.Context available
function JobFetchAndSave(url: string, entryId: string) {
  const result = Process("agent.Call", {
    assistant_id: "yao.keeper.classify",
    messages: [{ role: "user", content: `Classify: ${url}` }],
    timeout: 60,
  });

  if (result.error) {
    console.error("Classification failed:", result.error);
    return;
  }

  const data = Process("text.ExtractJSON", result.content);
  // Use classification result...
}
```

---

## 8. Source Code Reference

| Topic | File |
|-------|------|
| package.yao loading | `yao/agent/assistant/load.go` |
| Connector resolution | `yao/agent/assistant/agent.go` (`GetConnector`) |
| ConnectorOptions definition | `yao/agent/store/types/types.go` |
| Capabilities | `yao/agent/llm/capabilities.go`, `gou/connector/openai/openai.go` |
| ToolCallAdapter | `yao/agent/llm/adapters/toolcall.go` |
| Uses system | `yao/agent/context/types_llm.go` (`Uses` struct) |
| Auto search | `yao/agent/assistant/search.go` |
| LLM Providers API | `yao/openapi/llm/llm.go` (`GET /llm/providers`) |
| A2A Process (`agent.Call`) | `yao/agent/caller/process.go` |
| A2A types & Result | `yao/agent/caller/types.go` |
| A2A headless context | `yao/agent/caller/context.go` |
| A2A JSAPI (`ctx.agent.Call`) | `yao/agent/caller/jsapi.go` |
| A2A orchestrator | `yao/agent/caller/orchestrator.go` |
