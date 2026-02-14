# Testing Reference

Complete reference for Yao Agent testing via `yao agent test`.

## `yao` vs `yao-dev`

| Command | Use Case | Description |
|---------|----------|-------------|
| `yao agent test` | App development | Uses the installed Yao binary. Use when writing TS/JS only (no Go changes). |
| `yao-dev agent test` | Yao engine development | Shell script at `yao/bin/yao-dev`. Compiles and runs from source. Use when modifying Go code and need to test changes immediately. |

Both accept identical flags and arguments. The only difference is that `yao` runs the pre-built binary, while `yao-dev` compiles from source on the fly.

## Test Modes

| Mode | Trigger | Description |
|------|---------|-------------|
| Script | `-i scripts.X.Y.Z` | Unit tests for handler functions (no LLM) |
| Message | `-i "Hello"` | Quick E2E test with single message |
| JSONL | `-i tests/cases.jsonl` | Structured E2E test cases with assertions |

---

## CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `-n` | Agent ID (e.g. `yao.keeper`) | Auto-detect from path/cwd |
| `-i` | Input: message string, JSONL file path, or `scripts.X.Y` | Required |
| `-v` | Verbose output | false |
| `-u` | User ID for test context | `test-user` |
| `-t` | Team ID for test context | `test-team` |
| `--ctx` | Path to context JSON file | -- |
| `--run` | Regex filter for test names | -- |
| `-c` | Override connector | Agent default |
| `-o` | Output report file (.json/.html/.md) | -- |
| `--timeout` | Per-test timeout | 120s |
| `--parallel` | Number of parallel tests | 1 |
| `--runs` | Runs per test (stability analysis) | 1 |
| `--fail-fast` | Stop on first failure | false |

---

## ⚠ Known Issues & Required Workarounds

These are current quirks in the test runner that must be followed strictly to avoid cryptic failures:

### 1. Working directory MUST be the app root

Always run `yao agent test` from the **application root directory** (the directory containing `assistants/`, `models/`, etc.). Do NOT `cd` into `assistants/yao/keeper/` and run from there.

```bash
# ✅ Correct — run from app root
cd /path/to/my-app
yao agent test -n yao.keeper -i scripts.yao.keeper.store -v

# ❌ Wrong — will fail with path resolution errors
cd /path/to/my-app/assistants/yao/keeper
yao agent test -i scripts.yao.keeper.store -v
```

### 2. `--ctx` path MUST use `./` prefix or absolute path

Bare relative paths (without `./`) may fail to resolve. Always prefix with `./` or use an absolute path.

```bash
# ✅ Correct
yao agent test -n yao.keeper -i scripts.yao.keeper.store \
  --ctx ./assistants/yao/keeper/tests/ctx.json -v

# ✅ Also correct (absolute)
yao agent test -n yao.keeper -i scripts.yao.keeper.store \
  --ctx /Users/me/my-app/assistants/yao/keeper/tests/ctx.json -v

# ❌ Wrong — may fail silently or use default context
yao agent test -n yao.keeper -i scripts.yao.keeper.store \
  --ctx assistants/yao/keeper/tests/ctx.json -v
```

### 3. `ctx.json` must include `authorized` for MCP/Process tests

If your test calls MCP adapters or `Process()` functions that use `Authorized()` internally, the `authorized` block in `ctx.json` is **required**. Without it, `Authorized()` returns empty values and team-scoped queries silently return no results.

```json
{
  "chat_id": "test",
  "authorized": {
    "user_id": "test-user-001",
    "team_id": "team-001"
  }
}
```

### 4. `-n` agent ID must exactly match `package.yao` path

The `-n` flag value is the dot-separated path from `assistants/` to the directory containing `package.yao`. Partial names won't work.

```bash
# ✅ Correct — matches assistants/yao/keeper/package.yao
yao agent test -n yao.keeper -i scripts.yao.keeper.store

# ❌ Wrong — no assistant at assistants/keeper/
yao agent test -n keeper -i scripts.yao.keeper.store
```

### 5. JSONL / message input file paths also need `./` prefix

Same as `--ctx` — use `./` or absolute path for `-i` when pointing to a file:

```bash
# ✅ Correct
yao agent test -n yao.keeper -i ./assistants/yao/keeper/tests/cases.jsonl

# ❌ May fail
yao agent test -n yao.keeper -i assistants/yao/keeper/tests/cases.jsonl
```

### 6. Process paths inside tests require full `agents.` prefix

When calling `Process()` in test code, use the complete registered path including the `agents.` prefix:

```typescript
// ✅ Correct — full path
Process("agents.yao.keeper.store.Save", teamId, data);

// ❌ Wrong — missing agents. prefix
Process("yao.keeper.store.Save", teamId, data);
```

---

## Script Path Resolution

`-i scripts.X.Y.Z` is resolved by detecting `package.yao` from longest to shortest path:

```
scripts.yao.keeper.store
  assistant: yao/keeper (has package.yao)
  module: store
  file: assistants/yao/keeper/src/store_test.ts

scripts.yao.keeper.store.entry
  assistant: yao/keeper
  module path: store/entry
  file: assistants/yao/keeper/src/store/entry_test.ts

scripts.yao.keeper.tests.seed
  assistant: yao/keeper
  module path: tests/seed
  file: assistants/yao/keeper/src/tests/seed_test.ts

scripts.expense.setup
  assistant: expense
  module: setup
  file: assistants/expense/src/setup_test.ts
```

**Rules:**
- `src/` is always implicit -- never include it in the script path
- Last dot-segment is the module name, mapped to `{name}_test.ts`
- Middle segments (between assistant and module) become subdirectory path
- Assistant boundary is detected by `package.yao` presence

**Common mistakes:**
- `scripts.keeper.store` -- wrong if assistant is `yao/keeper` (should be `scripts.yao.keeper.store`)
- `scripts.yao.keeper.src.store` -- wrong: `src/` is implicit
- `-n` flag must match the assistant ID exactly (e.g. `yao.keeper`, not `keeper`)

---

## Test Function Signature

```typescript
import { testing, agent, Process } from "@yao/runtime";

// MUST: start with "Test", be exported
export function TestSomething(t: testing.T, ctx: agent.Context) {
  // t -- testing object with assert methods
  // ctx -- agent context (authorized, memory, etc.)
}
```

**Parameters:**
- `t: testing.T` -- provides assertions (`t.assert.*`) and control (`t.fail()`, `t.skip()`)
- `ctx: agent.Context` -- full agent context; `ctx.authorized` comes from `--ctx` file or `-u`/`-t` flags

---

## Context File (`tests/ctx.json`)

```json
{
  "chat_id": "test-session",
  "authorized": {
    "user_id": "test-user-001",
    "team_id": "team-001",
    "tenant_id": "",
    "client_id": "",
    "session_id": "",
    "constraints": {
      "owner_only": false,
      "team_only": false
    }
  },
  "metadata": {
    "mode": "test"
  },
  "locale": "en-us",
  "client": {
    "type": "test",
    "ip": "127.0.0.1"
  }
}
```

**Priority:** CLI flags (`-u`, `-t`) > ctx.json > test case fields > defaults

---

## Assertion API

### `t.assert` Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `True` | `True(value, msg?)` | Assert truthy |
| `False` | `False(value, msg?)` | Assert falsy |
| `Equal` | `Equal(actual, expected, msg?)` | Deep equality (JSON comparison) |
| `NotEqual` | `NotEqual(actual, expected, msg?)` | Deep inequality |
| `Nil` | `Nil(value, msg?)` | Assert null or undefined |
| `NotNil` | `NotNil(value, msg?)` | Assert not null/undefined |
| `Contains` | `Contains(str, substr, msg?)` | String contains substring |
| `NotContains` | `NotContains(str, substr, msg?)` | String does not contain |
| `Len` | `Len(value, length, msg?)` | Assert length (array, string, object) |
| `Greater` | `Greater(a, b, msg?)` | Assert a > b |
| `GreaterOrEqual` | `GreaterOrEqual(a, b, msg?)` | Assert a >= b |
| `Less` | `Less(a, b, msg?)` | Assert a < b |
| `LessOrEqual` | `LessOrEqual(a, b, msg?)` | Assert a <= b |
| `Match` | `Match(value, regex, msg?)` | Regex pattern match |
| `NotMatch` | `NotMatch(value, regex, msg?)` | Regex pattern not match |
| `Type` | `Type(value, typeName, msg?)` | JS type check: `"string"`, `"number"`, `"object"`, `"array"`, `"null"` |
| `JSONPath` | `JSONPath(obj, path, expected, msg?)` | Extract `$.path` and compare |
| `Panic` | `Panic(fn, msg?)` | Assert function throws |
| `NoPanic` | `NoPanic(fn, msg?)` | Assert function does not throw |
| `Error` | `Error(err, msg?)` | Assert non-null error |
| `NoError` | `NoError(err, msg?)` | Assert null error |
| `Agent` | `Agent(response, agentID, opts?)` | Validator agent assertion |

### `t` Control Methods

| Method | Description |
|--------|-------------|
| `t.log(...args)` | Log message (visible in `-v` mode) |
| `t.error(...args)` | Record error, mark test failed |
| `t.fail(reason?)` | Mark test failed |
| `t.fatal(reason?)` | Mark failed and stop execution |
| `t.skip(reason?)` | Skip test |

---

## Test Patterns

### Team ID Helper

```typescript
function teamId(ctx: agent.Context): string {
  return ctx.authorized?.team_id || "team-001";
}
```

### Error Case Testing

```typescript
export function TestBadInput(t: testing.T, ctx: agent.Context) {
  let threw = false;
  try {
    Save(teamId(ctx), { title: "" });
  } catch (e: any) {
    threw = true;
    t.assert.Contains(e.message, "title is required");
  }
  t.assert.True(threw, "should throw on empty title");
}
```

### Process Call Testing

```typescript
export function TestViaProcess(t: testing.T, ctx: agent.Context) {
  const tid = teamId(ctx);
  const result = Process("agents.myapp.store.Save", tid, { title: "Test", content: "x" });
  t.assert.True(result.entry_id.length > 0, "should create entry");

  const entry = Process("agents.myapp.store.Get", tid, result.entry_id);
  t.assert.Equal(entry.content, "x");

  // Cleanup
  Process("agents.myapp.store.Archive", tid, result.entry_id);
}
```

### MCP Adapter Testing

```typescript
// MCP uses Authorized() internally -- ctx.json provides identity
export function TestMCPSave(t: testing.T, ctx: agent.Context) {
  const result = MCPSave({ title: "Test " + Date.now(), content: "mcp test" });
  t.assert.NotNil(result.entry_id);

  const entry = MCPGet({ entry_id: result.entry_id });
  t.assert.Equal(entry.content, "mcp test");

  MCPArchive({ entry_id: result.entry_id });
}
```

### Cleanup Pattern

```typescript
export function TestWithCleanup(t: testing.T, ctx: agent.Context) {
  const tid = teamId(ctx);
  const saved = Save(tid, { title: "Tmp " + Date.now(), content: "tmp" });

  // ... test assertions ...

  // Always clean up
  Archive(tid, saved.entry_id);
}
```

---

## JSONL Test Cases

For E2E agent tests with LLM:

```jsonl
{"id": "T001", "input": "Hello", "assert": {"type": "contains", "value": "hello"}}
{"id": "T002", "input": [{"role": "user", "content": "Help me"}], "timeout": "60s"}
{"id": "T003", "input": "Skip this", "skip": true}
```

Per-test overrides:

```jsonl
{
  "id": "T004",
  "input": "Complex test",
  "user": "custom-user",
  "team": "custom-team",
  "metadata": {"mode": "task"},
  "options": {
    "connector": "gpt-4o",
    "mode": "task",
    "skip": {"history": true}
  },
  "before": "scripts:tests.env.Setup",
  "after": "scripts:tests.env.Cleanup"
}
```

---

## Stability Testing

Run each test multiple times:

```bash
yao-dev agent test -n myapp -i tests/cases.jsonl --runs 5 -v
```

| Class | Pass Rate | Description |
|-------|-----------|-------------|
| `stable` | 100% | All runs passed |
| `mostly_stable` | 80-99% | Occasional failures |
| `unstable` | 50-79% | Frequent failures |
| `highly_unstable` | < 50% | Mostly failing |
