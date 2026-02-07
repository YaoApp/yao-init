---
name: yao-agent-development
description: Guide for building AI Agents with Yao framework. Use when creating assistants, implementing hooks (Create/Next), defining MCP tools, database models, prompts, i18n, agent-to-agent communication (A2A), or working with the Context API. Trigger when user mentions Yao Agent, assistant development, hooks, MCP tools, or agent pipelines.
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
| `connector`         | Default LLM connector ID                  |
| `connector_options` | Fallback connectors and filters           |
| `mcp.servers`       | MCP tools to enable                       |
| `uses.search`       | Search behavior: `"disabled"`, `"<agent>"`|
| `modes`             | Supported modes: `"chat"`, `"task"`       |
| `share`             | Sharing: `"user"`, `"team"`, `"public"`   |

---

# Hooks

## Execution Flow

```
User Input → Load History → Create Hook → LLM Call → Tool Execution → Next Hook → Response
```

## Create Hook

Called before LLM call. Configure the request.

```typescript
import { agent } from "@yao/runtime";

function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  // Store data for Next hook
  ctx.memory.context.Set("start_time", Date.now());
  
  // Return null for default behavior
  return null;
  
  // Or return configuration
  return {
    messages,                    // Modified messages
    temperature: 0.7,            // Override temperature
    connector: "gpt-4o",         // Override connector
    prompt_preset: "task",       // Select prompt preset
    mcp_servers: [{ server_id: "agents.myapp.tools" }],
    uses: { search: "disabled" },
    locale: "zh-cn",
  };
  
  // Or delegate to another agent
  return {
    delegate: {
      agent_id: "specialist",
      messages: messages,
    },
  };
}
```

## Next Hook

Called after LLM response and tool calls.

```typescript
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { messages, completion, tools, error } = payload;
  
  // Handle errors
  if (error) {
    return { data: { status: "error", message: error } };
  }
  
  // Process tool results
  if (tools && tools.length > 0) {
    const result = tools[0].result;
    
    // Delegate based on result
    if (result?.intent === "query") {
      return {
        delegate: {
          agent_id: "query_agent",
          messages: payload.messages,
        },
      };
    }
    
    return {
      data: { status: "success", results: tools.map(t => t.result) },
    };
  }
  
  // Return null for standard LLM response
  return null;
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
// Set/Get
ctx.memory.context.Set("key", value);
ctx.memory.context.Set("key", value, 300);  // With TTL
const value = ctx.memory.context.Get("key");

// Counters
ctx.memory.user.Incr("api_calls");

// Lists
ctx.memory.chat.Push("history", [item1, item2]);
ctx.memory.chat.ArrayGet("history", -1);  // Last item
```

## Trace

```typescript
const node = ctx.trace.Add(
  { query: "input" },
  { label: "Processing", type: "process", icon: "play" }
);
node.Info("Step completed");
node.SetOutput({ result: data });
node.Complete();
// or node.Fail("error");
```

## MCP

```typescript
// Call tool
const result = ctx.mcp.CallTool("server_id", "tool_name", { arg: "value" });

// Parallel calls
const results = ctx.mcp.CallToolsParallel("server_id", [
  { name: "tool1", arguments: { a: 1 } },
  { name: "tool2", arguments: { b: 2 } },
]);
```

## Agent-to-Agent (A2A)

```typescript
// Call single agent
const result = ctx.agent.Call("specialist", messages, {
  onChunk: (msg) => { console.log(msg); return 0; }
});

// Parallel calls
const results = ctx.agent.All([
  { agent: "agent-1", messages: [...] },
  { agent: "agent-2", messages: [...] },
]);
```

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

export function Recognize(
  params: { intent: string; data: any },
  ctx: agent.Context
) {
  const { intent, data } = params;
  const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
  
  switch (intent) {
    case "query":
      return handleQuery(data, ownerID);
    case "submit":
      return handleSubmit(data, ctx);
    default:
      return { error: "Unknown intent" };
  }
}

function handleQuery(data: any, ownerID: string) {
  const records = Process("models.agents.myapp.order.Get", {
    wheres: [{ column: "__yao_created_by", value: ownerID }],
    limit: 20,
  });
  return { records };
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

**Usage:**

```typescript
// Model ID: agents.myapp.order
// Table: agents_myapp_order
Process("models.agents.myapp.order.Get", { limit: 10 });
Process("models.agents.myapp.order.Find", id);
Process("models.agents.myapp.order.Create", { title: "New", amount: 100 });
```

## Permission Columns

When `option.permission: true`:

| Column             | Description           |
| ------------------ | --------------------- |
| `__yao_created_by` | User who created      |
| `__yao_team_id`    | Team ID               |

```typescript
// Create with permission
Process("models.agents.myapp.order.Create", {
  title: "Order",
  __yao_created_by: ctx.authorized.user_id,
  __yao_team_id: ctx.authorized.team_id,
});

// Query with permission filter
Process("models.agents.myapp.order.Get", {
  wheres: [{ column: "__yao_created_by", value: ctx.authorized.user_id }],
});
```

---

# Prompts

**`prompts.yml`**:

```yaml
- role: system
  content: |
    # Assistant Name

    You are an assistant that helps users with [task].
    Current date: {{ $CTX.date }}
    User locale: {{ $CTX.locale }}

    ## Your Capabilities
    - ✅ You CAN do X
    - ❌ You CANNOT do Y

    ## Tools Available
    - `tool_name`: Description of what it does

    ## Operating Procedure
    1. Analyze user input
    2. Extract required information
    3. Call appropriate tool
```

## Prompt Presets

Create `prompts/` directory for different scenarios:

```
prompts/
├── chat.yml      # Chat mode prompts
└── task.yml      # Task mode prompts
```

Select in Create hook:

```typescript
return { prompt_preset: "task" };
```

---

# Locales

**`locales/en-us.yml`**:

```yaml
name: My Assistant
description: Helps with tasks
chat:
  title: New Chat
  prompts:
    - How can I help?
    - Show me recent items
```

**`locales/zh-cn.yml`**:

```yaml
name: 我的助手
description: 帮助完成任务
chat:
  title: 新对话
  prompts:
    - 有什么可以帮您？
    - 显示最近的项目
```

Reference in `package.yao` using `{{ key }}`.

---

# Common Patterns

## System Initialization Check

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  if (!SystemReady(ctx)) {
    Setup(ctx);
  }
  return { messages };
}

function SystemReady(ctx: agent.Context): boolean {
  const ownerID = ctx.authorized?.team_id || ctx.authorized?.user_id;
  const records = Process("models.agents.myapp.setting.Get", {
    wheres: [{ column: "user_id", value: ownerID }],
    limit: 1,
  });
  return Array.isArray(records) && records.length > 0;
}
```

## Loading Indicator

```typescript
function Create(ctx: agent.Context, messages: agent.Message[]): agent.Create {
  const loadingId = ctx.Send({
    type: "loading",
    props: { message: "Processing..." },
  });
  ctx.memory.context.Set("loading_id", loadingId);
  return { messages };
}

function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const loadingId = ctx.memory.context.Get("loading_id");
  if (loadingId) {
    ctx.Replace(loadingId, {
      type: "loading",
      props: { message: "✅ Done", done: true },
    });
  }
  return null;
}
```

## Multi-Agent Pipeline

```typescript
// Main agent delegates to sub-agents based on intent
function Next(ctx: agent.Context, payload: agent.Payload): agent.Next {
  const { tools } = payload;
  
  if (tools && tools[0]?.result?.intent) {
    const intent = tools[0].result.intent;
    
    // Delegate to specialized agent
    return {
      delegate: {
        agent_id: `myapp.${intent}`,
        messages: payload.messages,
      },
    };
  }
  
  return null;
}
```

## Locale Detection

```typescript
function isChinese(ctx: agent.Context): boolean {
  const locale = ctx.locale?.toLowerCase() || "";
  return locale.startsWith("zh") || locale === "cn";
}

const message = isChinese(ctx) ? "处理中..." : "Processing...";
```

---

# Testing

```bash
# Test with message
yao agent test -i "Hello" -n assistants.myapp

# Test with JSONL file
yao agent test -i tests/inputs.jsonl

# Script tests
yao agent test -i scripts.myapp.setup -v
```

**Test file (`src/*_test.ts`)**:

```typescript
export function TestRecognize(t: agent.T) {
  const result = Recognize({ intent: "query", data: {} }, t.ctx);
  t.assert.notNull(result, "Should return result");
  t.assert.eq(result.status, "success");
}
```

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

// Scripts
Process("scripts.mymodule.MyFunction", arg1, arg2);

// Session
Process("session.Get", "user");
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
