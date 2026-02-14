# Runtime API Reference

Core runtime APIs available in Yao scripts.

## Process

Call Yao backend processes.

```typescript
function Process(name: string, ...args: any[]): any;
```

### Agent-to-Agent Call (`agent.Call`)

Call an agent from any context (YaoJob, MCP, scripts) without requiring `agent.Context`:

```typescript
const result = Process("agent.Call", {
  assistant_id: "yao.keeper.classify",    // Required
  messages: [                              // Required
    { role: "user", content: "Classify this content..." },
  ],
  model: "deepseek.v3",                   // Optional: connector override
  timeout: 120,                            // Optional: seconds (default 600)
  metadata: { source: "job" },             // Optional
  locale: "zh-CN",                         // Optional
  chat_id: "custom-id",                    // Optional
});

// result.agent_id  — target assistant ID
// result.content   — LLM text response
// result.response  — full Response object (completion, next hook data)
// result.error     — error string if failed (empty on success)
```

**Key behaviors:** headless context (no Writer), `skip.output`/`skip.history` forced true, auth auto-injected, self-managed timeout (default 600s). See [context-api.md](context-api.md) for full parameter reference.

### Text Processing

```typescript
// Extract JSON from LLM output (handles code blocks, YAML, embedded JSON)
const data = Process("text.ExtractJSON", llmResponseText);
// Returns parsed object/array, or null on failure

// HTML ↔ Markdown
const md = Process("text.HTMLToMarkdown", htmlString);
const html = Process("text.MarkdownToHTML", mdString);

// Extract code blocks
const blocks = Process("text.Extract", llmOutput);         // All blocks
const first = Process("text.ExtractFirst", llmOutput);     // First block
const typed = Process("text.ExtractByType", llmOutput, "json"); // By type
```

**Best practice:** Always use `text.ExtractJSON` for parsing LLM structured output, not manual `JSON.parse` + regex.

### Model Processes

```typescript
// Query records
const records = Process("models.<model>.Get", {
  select: ["id", "name", "status"],
  wheres: [{ column: "status", value: "active" }],
  orders: [{ column: "created_at", option: "desc" }],
  limit: 10,
});

// Find by ID
const record = Process("models.<model>.Find", id, {
  select: ["id", "name"],
});

// Paginate
const result = Process("models.<model>.Paginate",
  { wheres: [...] },
  1,    // page
  20    // pageSize
);
// Returns: { data: [...], total: 100, page: 1, pagesize: 20 }

// Create
const id = Process("models.<model>.Create", {
  name: "New Record",
  status: "active",
});

// Update
Process("models.<model>.Update", id, {
  status: "inactive",
});

// Save (create or update)
const id = Process("models.<model>.Save", {
  id: existingId,  // Optional
  name: "Record",
});

// Delete
Process("models.<model>.Delete", id);

// Delete with conditions
Process("models.<model>.DeleteWhere", {
  wheres: [{ column: "status", value: "deleted" }],
});
```

### Query Parameters

```typescript
interface QueryParam {
  select?: string[];
  wheres?: Where[];
  orders?: Order[];
  limit?: number;
  offset?: number;
}

interface Where {
  column: string;
  value?: any;
  op?: "=" | ">" | "<" | ">=" | "<=" | "!=" | "like" | "in" | "not in";
  method?: "where" | "orwhere";
}

interface Order {
  column: string;
  option?: "asc" | "desc";
}
```

### Assistant Model Naming

```
Model ID: agents.<assistant_id>.<model_name>
Table: agents_<assistant_id>_<table_name>
```

Example: `models/order.mod.yao` in `assistants/expense/`:
- Model ID: `agents.expense.order`
- Table: `agents_expense_order`

---

## Console / Log

```typescript
// Console
console.log("Message", data);
console.info("Info");
console.warn("Warning");
console.error("Error", err);
console.debug("Debug");

// Structured logging
log.Trace("Trace: %s %v", "name", data);
log.Debug("Debug: %s", message);
log.Info("Info: %s", message);
log.Warn("Warning: %s", message);
log.Error("Error: %s", err);
```

---

## HTTP Client

```typescript
// GET
const resp = http.Get(url, query?, headers?);

// POST
const resp = http.Post(url, payload, files?, query?, headers?);

// PUT / PATCH / DELETE
const resp = http.Put(url, payload, query?, headers?);
const resp = http.Patch(url, payload, query?, headers?);
const resp = http.Delete(url, payload?, query?, headers?);

// Generic
const resp = http.Send(method, url, payload?, query?, headers?, files?);

// Streaming
http.Stream(method, url, callback, payload?, query?, headers?);
```

### Response

```typescript
interface HttpResponse {
  status: number;
  code: number;
  message: string;
  headers: Record<string, string[]>;
  data: any;
}
```

### Examples

```typescript
// GET with auth
const resp = http.Get(
  "https://api.example.com/users",
  { page: 1 },
  { Authorization: "Bearer token" }
);

if (resp.status === 200) {
  const users = resp.data;
}

// POST JSON
const resp = http.Post(
  "https://api.example.com/users",
  { name: "John" },
  {},
  {},
  { "Content-Type": "application/json" }
);

// File upload
const resp = http.Post(
  "https://api.example.com/upload",
  { description: "My file" },
  { file: "/path/to/file.pdf" }
);

// Streaming
http.Stream("POST", "https://api.example.com/stream",
  (data) => {
    console.log("Chunk:", data);
    return 1;  // 1=continue, 0=stop
  },
  payload, query, headers
);
```

---

## File System

```typescript
const fs = new FS("system");  // or "data"

// Read
const content = fs.ReadFile("/path/to/file.txt");
const buffer = fs.ReadFileBuffer("/path/to/file.txt");
const base64 = fs.ReadFileBase64("/path/to/file.txt");

// Write
fs.WriteFile("/path/to/file.txt", "content");
fs.WriteFile("/path/to/file.txt", "content", 0o644);
fs.WriteFileBuffer("/path/to/file.txt", uint8Array);
fs.AppendFile("/path/to/file.txt", "more");

// Delete
fs.Remove("/path/to/file.txt");
fs.RemoveAll("/path/to/directory");

// Directory
const files = fs.ReadDir("/path/to/dir");
const filesRecursive = fs.ReadDir("/path/to/dir", true);
fs.Mkdir("/path/to/dir");
fs.MkdirAll("/path/to/deep/dir");

// Check
const exists = fs.Exists("/path/to/file");
const isDir = fs.IsDir("/path");
const isFile = fs.IsFile("/path/to/file");

// Info
const name = fs.BaseName("/path/to/file.txt");  // "file.txt"
const dir = fs.DirName("/path/to/file.txt");    // "/path/to"
const ext = fs.ExtName("/path/to/file.txt");    // ".txt"
const mime = fs.MimeType("/path/to/file.txt");
const size = fs.Size("/path/to/file.txt");

// Operations
fs.Copy("/source", "/dest");
fs.Move("/source", "/dest");
fs.Zip("/path/to/dir", "/archive.zip");
const files = fs.Unzip("/archive.zip", "/extract/to");
const matches = fs.Glob("/path/*.txt");
```

---

## Store (Cache/KV)

Go process-level key-value store. All Stores with the same name are shared across V8 isolates — data persists when isolates are destroyed.

### Built-in Stores

| Store Name | Backend | Purpose |
|------------|---------|---------|
| `__yao.cache` | LRU (memory) | General cache, lost on process restart |
| `__yao.store` | Xun (DB) | Persistent KV with LRU cache layer |
| `__yao.agent.cache` | LRU | Agent-specific cache |

### Core API

```typescript
const cache = new Store("__yao.cache");

// Basic
cache.Set("key", value);
cache.Set("key", value, 3600);  // TTL in seconds
const val = cache.Get("key");
const exists = cache.Has("key");
cache.Del("key");
const val2 = cache.GetDel("key");

// Cache-aside pattern (recommended)
const data = cache.GetSet("key", (k) => expensiveQuery(k), 60);

// Batch operations
cache.SetMulti({ "k1": v1, "k2": v2 }, 60);
const vals = cache.GetMulti(["k1", "k2"]);
cache.DelMulti(["k1", "k2"]);

// Collection
const keys = cache.Keys();
const count = cache.Len();
cache.Clear();

// Lists
cache.Push("list", value1, value2);
const value = cache.Pop("list", 0);   // First
const value2 = cache.Pop("list", -1); // Last
cache.Pull("list", valueToRemove);
cache.AddToSet("set", value1, value2);

// Array access
const len = cache.ArrayLen("list");
const item = cache.ArrayGet("list", 0);
cache.ArraySet("list", 0, newValue);
const slice = cache.ArraySlice("list", 0, 10);
const page = cache.ArrayPage("list", 1, 20);
const all = cache.ArrayAll("list");
```

### Key Naming Convention

```
<namespace>:<entity>:<id>
```

Examples: `keeper:config:team_abc`, `keeper:webfetch:url_hash`

### Important

```typescript
// !! Wrong: JS variable cache — lost when V8 isolate is destroyed
let _cache: any = null;

// !! Correct: Store cache — Go process-level, shared across isolates
const cache = new Store("__yao.cache");
cache.GetSet("key", () => queryDB(), 60);
```

V8 isolates can be destroyed at any time. Never use module-level JS variables for caching.

---

## Query

```typescript
const query = new Query("default");

// Get all
const records = query.Get({
  select: ["id", "name"],
  from: "users",
  wheres: [{ column: "status", value: "active" }],
  limit: 100,
});

// Get first
const user = query.First({
  select: ["id", "name"],
  from: "users",
  wheres: [{ column: "id", value: 1 }],
});

// Paginate
const result = query.Paginate({
  select: ["id", "name"],
  from: "users",
  page: 1,
  pagesize: 20,
});

// Raw SQL
const result = query.Run({
  stmt: "SELECT version()",
});
```

---

## Time

```typescript
// Sleep
time.Sleep(1000);  // Milliseconds

// Delayed execution
time.After(5000, "scripts.module.Task", arg1, arg2);
```

---

## Utilities

```typescript
// Localization
const text = $L("::messages.welcome");

// Base64
const encoded = btoa("Hello");
const decoded = atob("SGVsbG8=");

// Authorized info (SUI pages)
const auth = Authorized();
const userId = auth?.user_id;
const teamId = auth?.team_id;
```

---

## Type Conversion

### Go → JavaScript

| Go Type                  | JavaScript Type |
| ------------------------ | --------------- |
| `nil`                    | `null`          |
| `bool`                   | `boolean`       |
| `int`, `float64`         | `number`        |
| `string`                 | `string`        |
| `[]byte`                 | `Uint8Array`    |
| `map[string]interface{}` | `object`        |
| `[]interface{}`          | `array`         |
| `error`                  | `Error`         |

### JavaScript → Go

| JavaScript Type  | Go Type                  |
| ---------------- | ------------------------ |
| `null`           | `nil`                    |
| `boolean`        | `bool`                   |
| `number`         | `int` or `float64`       |
| `string`         | `string`                 |
| `Uint8Array`     | `[]byte`                 |
| `object`         | `map[string]interface{}` |
| `array`          | `[]interface{}`          |
| `Error`          | `error`                  |

---

## Error Handling

```typescript
try {
  const result = Process("models.user.Find", 999999);
} catch (e) {
  console.error("Error:", e.message);
}
```
