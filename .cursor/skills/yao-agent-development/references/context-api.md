# Context API Reference

Complete reference for the Agent Context object (`ctx`).

## Basic Properties

```typescript
interface Context {
  chat_id: string;           // Current chat session ID
  assistant_id: string;      // Assistant identifier
  locale: string;            // User locale (e.g., "en-us", "zh-cn")
  theme: string;             // UI theme preference
  route: string;             // Request route path
  
  client: {
    type: string;            // Client type
    user_agent: string;      // User agent string
    ip: string;              // Client IP address
  };
  
  metadata: Record<string, any>;    // Custom metadata
  authorized: Authorized;           // Auth info
  
  memory: Memory;            // Memory namespaces
  trace: Trace;              // Trace/debug
  mcp: MCP;                  // MCP tools/resources
  search: Search;            // Search API
  agent: Agent;              // A2A calls
  llm: LLM;                  // Direct LLM calls
  sandbox?: Sandbox;         // Sandbox ops (if configured)
}
```

## Authorized Object

```typescript
interface Authorized {
  user_id?: string;          // User ID
  team_id?: string;          // Team ID (if team login)
  tenant_id?: string;        // Tenant ID (multi-tenancy)
  client_id?: string;        // OAuth client ID
  session_id?: string;       // Session ID
  
  constraints?: {
    owner_only?: boolean;    // Only own data
    creator_only?: boolean;  // Only created data
    editor_only?: boolean;   // Only edited data
    team_only?: boolean;     // Only team data
    extra?: Record<string, any>;
  };
}
```

**Get Owner ID:**

```typescript
function getOwnerID(ctx: agent.Context): string | null {
  const auth = ctx.authorized;
  if (!auth) return null;
  return auth.team_id || auth.user_id || null;
}
```

## Messaging Methods

| Method                               | Description                 | Auto End | Updatable |
| ------------------------------------ | --------------------------- | -------- | --------- |
| `Send(message, block_id?)`           | Send complete message       | ✅       | ❌        |
| `SendStream(message, block_id?)`     | Start streaming message     | ❌       | ✅        |
| `Append(id, content, path?)`         | Append to message           | -        | -         |
| `Replace(id, message)`               | Replace message content     | -        | -         |
| `Merge(id, data, path?)`             | Merge data into message     | -        | -         |
| `Set(id, data, path)`                | Set field in message        | -        | -         |
| `End(id, final?)`                    | Finalize streaming message  | ✅       | -         |
| `EndBlock(block_id)`                 | End message block           | -        | -         |

**ID Generators:**

```typescript
const msg_id = ctx.MessageID();
const block_id = ctx.BlockID();
const thread_id = ctx.ThreadID();
```

**Examples:**

```typescript
// Complete message
ctx.Send({ type: "text", props: { content: "Hello!" } });
ctx.Send("Simple text");

// With block grouping
const block_id = ctx.BlockID();
ctx.Send("Step 1", block_id);
ctx.Send("Step 2", block_id);
ctx.EndBlock(block_id);

// Streaming
const id = ctx.SendStream("Processing...");
ctx.Append(id, " step 1...");
ctx.Append(id, " step 2...");
ctx.End(id);

// Replace content
const id = ctx.SendStream({ type: "loading", props: { message: "Loading..." } });
// Later...
ctx.Replace(id, { type: "text", props: { content: "Complete!" } });
ctx.End(id);
```

## Memory API

### Namespaces

| Namespace            | Scope      | Persistence | Use Case                   |
| -------------------- | ---------- | ----------- | -------------------------- |
| `ctx.memory.user`    | Per user   | Persistent  | User preferences, settings |
| `ctx.memory.team`    | Per team   | Persistent  | Team configurations        |
| `ctx.memory.chat`    | Per chat   | Persistent  | Conversation state         |
| `ctx.memory.context` | Per request| Temporary   | Data between hooks         |

### Methods

```typescript
interface MemoryNamespace {
  // Basic KV
  Get(key: string): any;
  Set(key: string, value: any, ttl?: number): void;
  Del(key: string): void;              // Supports wildcards: "prefix:*"
  Has(key: string): boolean;
  GetDel(key: string): any;
  
  // Collection
  Keys(): string[];
  Len(): number;
  Clear(): void;
  
  // Counters
  Incr(key: string, delta?: number): number;
  Decr(key: string, delta?: number): number;
  
  // Lists
  Push(key: string, values: any[]): number;
  Pop(key: string): any;
  Pull(key: string, count: number): any[];
  PullAll(key: string): any[];
  AddToSet(key: string, values: any[]): number;
  
  // Array access
  ArrayLen(key: string): number;
  ArrayGet(key: string, index: number): any;   // -1 for last
  ArraySet(key: string, index: number, value: any): void;
  ArraySlice(key: string, start: number, end: number): any[];
  ArrayPage(key: string, page: number, size: number): any[];
  ArrayAll(key: string): any[];
}
```

**Examples:**

```typescript
// Pass data between hooks
function Create(ctx, messages) {
  ctx.memory.context.Set("start_time", Date.now());
  ctx.memory.context.Set("original_query", messages[0]?.content);
  return { messages };
}

function Next(ctx, payload) {
  const duration = Date.now() - ctx.memory.context.Get("start_time");
  console.log(`Duration: ${duration}ms`);
}

// User preferences
ctx.memory.user.Set("theme", "dark");
const theme = ctx.memory.user.Get("theme");

// Rate limiting
const count = ctx.memory.user.Incr("api_calls_today");
if (count > 100) throw new Error("Rate limit exceeded");

// Chat history
ctx.memory.chat.Push("messages", [msg1, msg2]);
const lastMsg = ctx.memory.chat.ArrayGet("messages", -1);
```

## Trace API

```typescript
interface Trace {
  Add(input: any, option: TraceOption): TraceNode;
  Parallel(inputs: { input: any; option: TraceOption }[]): TraceNode[];
  Info(message: string): void;
  Debug(message: string): void;
  Warn(message: string): void;
  Error(message: string): void;
}

interface TraceOption {
  label: string;
  type?: string;
  icon?: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface TraceNode {
  Info(message: string): void;
  Debug(message: string): void;
  Warn(message: string): void;
  Error(message: string): void;
  SetOutput(output: any): void;
  SetMetadata(key: string, value: any): void;
  Complete(output?: any): void;
  Fail(error: string): void;
}
```

**Example:**

```typescript
const node = ctx.trace.Add(
  { query: "search term" },
  { label: "Search", type: "search", icon: "search" }
);
node.Info("Starting search");
node.Debug("Query validated");
// ... do work ...
node.Complete({ results: 10 });
```

## MCP API

```typescript
interface MCP {
  ListTools(client: string, cursor?: string): ToolList;
  CallTool(client: string, name: string, args?: any): any;
  CallTools(client: string, tools: ToolCall[]): any[];
  CallToolsParallel(client: string, tools: ToolCall[]): any[];
  
  ListResources(client: string, cursor?: string): ResourceList;
  ReadResource(client: string, uri: string): any;
  
  ListPrompts(client: string, cursor?: string): PromptList;
  GetPrompt(client: string, name: string, args?: any): any;
  
  // Cross-server calls
  All(requests: MCPRequest[]): MCPResult[];
  Any(requests: MCPRequest[]): MCPResult[];
  Race(requests: MCPRequest[]): MCPResult[];
}

interface ToolCall {
  name: string;
  arguments?: any;
}

interface MCPRequest {
  mcp: string;
  tool: string;
  arguments?: any;
}
```

**Examples:**

```typescript
// Call single tool
const result = ctx.mcp.CallTool("agents.myapp.tools", "search", { query: "term" });

// Parallel calls
const results = ctx.mcp.CallToolsParallel("agents.myapp.tools", [
  { name: "search", arguments: { query: "a" } },
  { name: "search", arguments: { query: "b" } },
]);

// Cross-server
const results = ctx.mcp.All([
  { mcp: "server1", tool: "search", arguments: { q: "query" } },
  { mcp: "server2", tool: "fetch", arguments: { id: 1 } },
]);
```

## Agent API (A2A)

```typescript
interface Agent {
  Call(agentID: string, messages: Message[], opts?: AgentOptions): AgentResult;
  All(requests: AgentRequest[], opts?: GlobalOptions): AgentResult[];
  Any(requests: AgentRequest[], opts?: GlobalOptions): AgentResult[];
  Race(requests: AgentRequest[], opts?: GlobalOptions): AgentResult[];
}

interface AgentOptions {
  connector?: string;
  mode?: string;
  metadata?: Record<string, any>;
  skip?: {
    history?: boolean;
    trace?: boolean;
    output?: boolean;
  };
  onChunk?: (msg: Message) => number;  // 0=continue, non-zero=stop
}

interface AgentRequest {
  agent: string;
  messages: Message[];
  options?: AgentOptions;
}
```

**Examples:**

```typescript
// Call single agent
const result = ctx.agent.Call("specialist", messages, {
  onChunk: (msg) => {
    console.log("Chunk:", msg);
    return 0;
  },
});

// Parallel calls
const results = ctx.agent.All([
  { agent: "agent-1", messages: [...] },
  { agent: "agent-2", messages: [...] },
], {
  onChunk: (agentId, index, msg) => {
    console.log(`${agentId}[${index}]:`, msg);
    return 0;
  },
});
```

## LLM API

```typescript
interface LLM {
  Stream(connector: string, messages: Message[], opts?: LLMOptions): LLMResult;
  All(requests: LLMRequest[], opts?: GlobalOptions): LLMResult[];
  Any(requests: LLMRequest[], opts?: GlobalOptions): LLMResult[];
  Race(requests: LLMRequest[], opts?: GlobalOptions): LLMResult[];
}

interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  tools?: object[];
  onChunk?: (msg: Message) => number;
}
```

**Example:**

```typescript
const result = ctx.llm.Stream("gpt-4o", messages, {
  temperature: 0.7,
  onChunk: (msg) => {
    console.log("Chunk:", msg.props?.content);
    return 0;
  },
});
```

## Sandbox API

Available when `sandbox` is configured in `package.yao`.

```typescript
interface Sandbox {
  workdir: string;
  ReadFile(path: string): string;
  WriteFile(path: string, content: string): void;
  ListDir(path: string): FileInfo[];
  Exec(command: string[]): string;
}
```

**Example:**

```typescript
function Next(ctx, payload) {
  if (ctx.sandbox && !payload.error) {
    const files = ctx.sandbox.ListDir("output");
    const results = files.map(f => ({
      name: f.name,
      content: ctx.sandbox.ReadFile(`output/${f.name}`),
    }));
    return { data: { files: results } };
  }
  return null;
}
```
