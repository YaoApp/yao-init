# Cache / Store (`gou/store`)

> **Runtime API:** `new Store(name)`

Yao's built-in key-value store, supporting multiple backends (LRU, Redis, Xun database, etc.). Create an instance with `new Store(name)` in JS/TS — all Stores with the same name are shared across the entire Go process, independent of V8 isolate lifecycle. Data is not lost when the isolate is destroyed.

### Built-in System Stores

| Store Name | Backend | Purpose |
|------------|---------|---------|
| `__yao.cache` | LRU | General-purpose cache (process-level memory) |
| `__yao.store` | Xun (DB) | General-purpose persistent key-value store |
| `__yao.agent.cache` | LRU | Agent-specific cache |
| `__yao.agent.memory.*` | Xun (DB) | Agent memory (user/team/chat/context) |

> Applications can also define custom Stores in the `stores/` directory.

### Core API

```typescript
const cache = new Store("__yao.cache");

// Basic read/write
cache.Set("key", value);              // Never expires
cache.Set("key", value, 60);          // TTL = 60 seconds
const val = cache.Get("key");         // Returns value on hit, undefined on miss
cache.Del("key");                     // Delete
cache.Has("key");                     // Check existence

// Cache-aside pattern (recommended)
const data = cache.GetSet("key", (k) => {
  return expensiveQuery(k);           // Only executes on cache miss
}, 60);

// Batch operations
cache.SetMulti({ "k1": v1, "k2": v2 }, 60);
const vals = cache.GetMulti(["k1", "k2"]);
cache.DelMulti(["k1", "k2"]);

// List operations (MongoDB-style)
cache.Push("list", item1, item2);     // Append
cache.Pop("list", 1);                 // Pop from end
cache.ArrayAll("list");               // Get all
cache.ArrayPage("list", 1, 20);      // Paginate
cache.AddToSet("tags", "a", "b");    // Deduplicated append
```

### Key Naming Convention

```
<namespace>:<entity>:<id>
```

Examples:
- `keeper:config:team_abc` — Keeper team config cache
- `keeper:webfetch:url_hash` — URL fetch result cache
- `keeper:media:file_id` — Media processing result cache

### LRU vs Xun Selection

| Scenario | Recommended Store | Reason |
|----------|-------------------|--------|
| Config cache, hot data | `__yao.cache` (LRU) | Pure memory, fastest, lost on process restart |
| Persistent data | `__yao.store` (Xun) | Database persistence with LRU cache layer |
| Agent session context | `__yao.agent.memory.*` | Scoped isolation (user/team/chat) |

### Difference from JS Variable Cache

```typescript
// ❌ Wrong: JS variable cache — lost when isolate is destroyed
let _cache: any = null;
function getConfig() {
  if (_cache) return _cache;
  _cache = queryDB();
  return _cache;
}

// ✅ Correct: Store cache — Go process-level, shared across all isolates
function getConfig(teamId: string) {
  const cache = new Store("__yao.cache");
  return cache.GetSet(`keeper:config:${teamId}`, () => queryDB(teamId), 60);
}
```

> **Key point: V8 isolates can be destroyed and recreated at any time. JS module-level variables must not be used for caching. All caching must use `Store`.**

**Keeper usage:** Team config cache (`src/utils/config.ts` uses `__yao.cache` to cache `KeeperConfig`), URL deduplication check, API rate limit counting.
