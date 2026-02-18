# Concurrent Execution (`gou/v8 globals`)

> **Global functions:** `All`, `Any`, `Race`

V8 runtime built-in synchronous concurrency primitives for concurrently executing multiple Process calls in JS/TS scripts. Implemented via Go goroutines under the hood; the V8 thread blocks synchronously until results are ready.

### API

| Function | Semantics | Description |
|----------|-----------|-------------|
| `All(tasks)` | `Promise.all` | Execute all tasks concurrently, return when **all complete** |
| `Any(tasks)` | `Promise.any` | Execute all tasks concurrently, complete when **first succeeds** (still waits for all goroutines to finish) |
| `Race(tasks)` | `Promise.race` | Execute all tasks concurrently, complete when **first finishes** (success or failure) |

### Task Format

```typescript
// Input: array of Tasks
const tasks = [
  { process: "agents.yao.keeper.webfetch.URL", args: ["https://example.com", {}] },
  { process: "agents.yao.keeper.webfetch.URL", args: ["https://another.com", {}] },
];

// Call
const results = All(tasks);
```

### TaskResult Format

```typescript
// Return value: array of TaskResult (order matches input)
[
  { data: any, index: 0 },                    // Success: data is Process return value
  { data: null, error: "error message", index: 1 },  // Failure: error contains error message
]
```

| Field | Type | Description |
|-------|------|-------------|
| `data` | `any` | Return value when task succeeds (null on failure) |
| `error` | `string?` | Only present on failure, contains error message |
| `index` | `number` | Original task index (preserves input order) |

### Concurrency Characteristics

- **Synchronous blocking:** JS/TS calling `All(tasks)` blocks until all results are ready. Not a background Job.
- **Go-level concurrency:** Each task runs in a separate Go goroutine; the V8 thread does not participate.
- **Error isolation:** A single task failure does not affect others; failed tasks are marked with `error` in the result.
- **Session/Auth propagation:** Automatically inherits caller's SID, Global, and Authorized info.

### Example

```typescript
import { Exception } from "@yao/runtime";

// Batch fetch — 3 URLs concurrently, total time ≈ slowest one
const results = All([
  { process: "agents.yao.keeper.webfetch.URL", args: ["https://a.com"] },
  { process: "agents.yao.keeper.webfetch.URL", args: ["https://b.com"] },
  { process: "agents.yao.keeper.webfetch.URL", args: ["https://c.com"] },
]);

for (const r of results) {
  if (r.error) {
    console.log(`Task ${r.index} failed: ${r.error}`);
    continue;
  }
  console.log(`Task ${r.index}: ${r.data.title}`);
}
```

**Keeper usage:** Batch URL fetch (`webfetch.URLBatch` uses `All()` internally), concurrent multi-provider race (first completion wins), concurrent fetch from multiple data sources.
