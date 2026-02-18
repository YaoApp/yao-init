# Authorization & Team Context

> **Runtime API:** `Authorized()` (V8 global function), `ctx.authorized` (agent hook context)

How to obtain the current user's team and identity within Keeper scripts and hooks.

## `Authorized()` — V8 Global Function

Available in any Yao V8 script (Process Handlers, MCP Adapters, etc.).

```typescript
const auth = Authorized();
// auth.team_id   — current team identifier (e.g. "team-001")
// auth.user_id   — current user identifier
// auth.scopes    — permission scopes array
```

**Return value:** `{ team_id, user_id, scopes, ... }` or throws if no authentication context.

**Typical usage in store.ts:**

```typescript
function getTeamId(): string {
  try {
    const auth = Authorized();
    if (auth?.team_id) return auth.team_id;
  } catch {}
  return "team-001"; // fallback for dev/test
}
```

## `ctx.authorized` — Agent Hook Context

Available in agent hooks (`Create`, `Next`) via the context parameter.

```typescript
export function Create(ctx: agent.Context): agent.CreateResponse {
  const teamId = ctx.authorized?.team_id || "team-001";
  const userId = ctx.authorized?.user_id;
  // ...
}
```

## Convention: Process Handler vs MCP Adapter

| Layer | `team_id` source | Exposed to caller? |
|-------|-------------------|-------------------|
| Process Handler | `data.team_id` &#124;&#124; `Authorized().team_id` &#124;&#124; fallback | Yes (optional param) |
| MCP Adapter | `Authorized().team_id` only | No (LLM does not know team_id) |
| Agent Hook | `ctx.authorized.team_id` | No (implicit from session) |

**Rule:** MCP Adapters must never expose `team_id` as a parameter. LLMs should not need to know or guess team IDs.

## Fields Available

| Field | Type | Description |
|-------|------|-------------|
| `team_id` | string | Organization/team identifier for data isolation |
| `user_id` | string | Current user identifier |
| `scopes` | string[] | Permission scopes granted to this session |

## Testing with `ctx.authorized`

The test runner populates `ctx.authorized` (and the `Authorized()` global) from CLI flags or a context file.

### Context File (`tests/ctx.json`)

```json
{
  "chat_id": "keeper-test",
  "authorized": {
    "user_id": "test-user-001",
    "team_id": "team-001"
  },
  "metadata": {
    "mode": "test"
  }
}
```

### Running Tests

```bash
# Use context file (recommended — centralizes test identity)
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store --ctx ./assistants/yao/keeper/tests/ctx.json -v

# Or use CLI flags directly
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store -u test-user-001 -t team-001 -v
```

### Accessing in Test Functions

Script tests receive `ctx` as the second parameter. Use `ctx.authorized` to get team/user info:

```typescript
export function TestSomething(t: testing.T, ctx: agent.Context) {
  const teamId = ctx.authorized?.team_id || "team-001";
  const userId = ctx.authorized?.user_id;
  // ...
}
```

**Note:** `Authorized()` is also available in script tests — the test runner sets up the V8 share data so that `Authorized()` returns the same values as `ctx.authorized`. Process Handlers and MCP Adapters that call `Authorized()` internally will automatically receive the test context.

### Convention for Test Files

Internal functions that accept `teamId` as a parameter should resolve it from `ctx`:

```typescript
function teamId(ctx: agent.Context): string {
  return ctx.authorized?.team_id || "team-001";
}

export function TestXxx(t: testing.T, ctx: agent.Context) {
  const TEAM_ID = teamId(ctx);
  const result = createCategory(TEAM_ID, { name: "test" });
  // ...
}
```

Top-level Process Handlers (e.g. `Save`, `Get`) use `Authorized()` internally — no need to pass `team_id` in tests; the framework handles it automatically.

## Error Handling

`Authorized()` may throw if there is no authentication context (e.g. during automated scripts without a user session). Always wrap in try/catch with a fallback:

```typescript
let teamId = "team-001"; // default fallback
try {
  const auth = Authorized();
  if (auth?.team_id) teamId = auth.team_id;
} catch {
  // No auth context — use fallback
}
```
