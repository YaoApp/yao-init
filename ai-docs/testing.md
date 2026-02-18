# Agent Testing

> CLI tool: `yao agent test` (or `yao-dev agent test` when developing the Yao engine itself)
> Source: `yao/agent/test/`

**`yao` vs `yao-dev`:**
- `yao agent test` — uses the installed Yao binary. For app development (TS/JS only, no Go changes).
- `yao-dev agent test` — shell script at `yao/bin/yao-dev`, compiles and runs from source. For Yao engine development (when modifying Go code).
- Both accept identical flags and arguments.

Two testing modes: **Script Tests** (unit tests for handler functions) and **Agent Tests** (end-to-end LLM conversations).

---

## 1. Script Tests (Primary Mode)

Test Process Handlers, MCP Adapters, and utility functions without LLM calls.

### File Convention

Test files live alongside the source in `src/` with `_test.ts` suffix:

```
assistants/yao/keeper/
  src/
    store.ts              # Source module
    store_test.ts         # Tests for store
    store/
      entry.ts
      entry_test.ts       # Tests in subdirectory
      category_test.ts
    tests/
      seed_test.ts        # Tests in nested subdirectory
  tests/
    ctx.json              # Shared test context
```

### Test Function Signature

```typescript
import { testing, agent, Process } from "@yao/runtime";

// Function name MUST start with "Test" and be exported
export function TestSomething(t: testing.T, ctx: agent.Context) {
  // t - testing assertions object
  // ctx - agent context with authorized info, memory, etc.

  const result = Process("agents.yao.keeper.store.Save", teamId, data);
  t.assert.True(result.entry_id.length > 0, "should have entry_id");
  t.assert.Equal(result.title, "expected title", "title should match");
}
```

### Running Script Tests

```bash
# Basic: test a module
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store -v

# With context file (recommended for team_id/user_id)
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store \
  --ctx ./assistants/yao/keeper/tests/ctx.json -v

# Test nested subdirectory module
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.tests.seed \
  --ctx ./assistants/yao/keeper/tests/ctx.json -v

# Filter specific tests (regex)
yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store \
  --ctx ./assistants/yao/keeper/tests/ctx.json --run "TestMCP" -v
```

### Script Path Resolution (Common Pitfall)

The `-i scripts.X.Y.Z` path is resolved by finding `package.yao` from longest to shortest:

```
scripts.yao.keeper.store
  -> find package.yao for "yao/keeper" (assistants/yao/keeper/)
  -> remaining: "store"
  -> look for: assistants/yao/keeper/src/store_test.ts

scripts.yao.keeper.tests.seed
  -> find package.yao for "yao/keeper" (assistants/yao/keeper/)
  -> remaining: "tests/seed"
  -> look for: assistants/yao/keeper/src/tests/seed_test.ts

scripts.yao.keeper.store.entry
  -> find package.yao for "yao/keeper" (assistants/yao/keeper/)
  -> remaining: "store/entry"
  -> look for: assistants/yao/keeper/src/store/entry_test.ts
```

**Key rule:** Everything before the `package.yao` boundary is the assistant path. Everything after maps to `src/` subdirectories + module name.

**Common errors:**
- Using wrong assistant ID prefix (e.g. `scripts.keeper.store` instead of `scripts.yao.keeper.store`)
- Forgetting the `src/` directory is implicit -- do NOT include it in the script path
- Module name is always the **last** dot-segment, mapped to `{module}_test.ts`
- Subdirectories between assistant and module become path separators (dots become slashes)

---

## ⚠ Known Issues & Required Workarounds

These are current quirks in the test runner. Follow strictly to avoid cryptic failures:

### Working directory MUST be the app root

Always run from the **application root directory** (containing `assistants/`, `models/`, etc.):

```bash
# ✅ Correct
cd /path/to/my-app
yao agent test -n yao.keeper -i scripts.yao.keeper.store -v

# ❌ Wrong — path resolution breaks
cd /path/to/my-app/assistants/yao/keeper
yao agent test -i scripts.yao.keeper.store -v
```

### `--ctx` and `-i` file paths MUST use `./` or absolute path

Bare relative paths (without `./`) may fail to resolve:

```bash
# ✅ Correct
--ctx ./assistants/yao/keeper/tests/ctx.json
-i ./assistants/yao/keeper/tests/cases.jsonl

# ❌ May fail silently
--ctx assistants/yao/keeper/tests/ctx.json
```

### `ctx.json` must include `authorized` for MCP/Process tests

If tests call MCP adapters or `Process()` that use `Authorized()`, the `authorized` block is **required**. Without it, `Authorized()` returns empty values and team-scoped queries silently return no results.

### `-n` agent ID must exactly match `package.yao` path

```bash
# ✅ matches assistants/yao/keeper/package.yao
-n yao.keeper

# ❌ no assistant at assistants/keeper/
-n keeper
```

### Process paths in tests require full `agents.` prefix

```typescript
// ✅ Correct
Process("agents.yao.keeper.store.Save", tid, data);

// ❌ Wrong — missing prefix
Process("yao.keeper.store.Save", tid, data);
```

---

## 2. Context File (`ctx.json`)

Provides test identity (team_id, user_id) and metadata. Placed in `tests/ctx.json`:

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

**Full ContextConfig fields:**

| Field | Type | Description |
|-------|------|-------------|
| `chat_id` | string | Chat session ID for the test |
| `authorized.user_id` | string | User identifier |
| `authorized.team_id` | string | Team identifier |
| `authorized.tenant_id` | string | Tenant ID (multi-tenancy) |
| `authorized.client_id` | string | OAuth client ID |
| `authorized.session_id` | string | Session ID |
| `authorized.constraints` | object | Data access constraints |
| `metadata` | object | Custom metadata passed to ctx |
| `locale` | string | Override locale |
| `referer` | string | Override referer |
| `client.type` | string | Client type |
| `client.ip` | string | Client IP |

**Priority:** CLI flags (`-u`, `-t`) > ctx.json values > test case values > defaults (`test-user` / `test-team`)

---

## 3. Assertion API (`t.assert`)

Available methods on `t.assert`:

| Method | Signature | Description |
|--------|-----------|-------------|
| `True` | `True(value, msg?)` | Assert value is truthy |
| `False` | `False(value, msg?)` | Assert value is falsy |
| `Equal` | `Equal(actual, expected, msg?)` | Deep equality |
| `NotEqual` | `NotEqual(actual, expected, msg?)` | Not equal |
| `Nil` | `Nil(value, msg?)` | Assert null/undefined |
| `NotNil` | `NotNil(value, msg?)` | Assert not null/undefined |
| `Contains` | `Contains(str, substr, msg?)` | String contains |
| `NotContains` | `NotContains(str, substr, msg?)` | String does not contain |
| `Len` | `Len(value, length, msg?)` | Assert length |
| `Greater` | `Greater(a, b, msg?)` | Assert a > b |
| `GreaterOrEqual` | `GreaterOrEqual(a, b, msg?)` | Assert a >= b |
| `Less` | `Less(a, b, msg?)` | Assert a < b |
| `LessOrEqual` | `LessOrEqual(a, b, msg?)` | Assert a <= b |
| `Match` | `Match(value, regex, msg?)` | Regex match |
| `NotMatch` | `NotMatch(value, regex, msg?)` | Regex not match |
| `Type` | `Type(value, typeName, msg?)` | Type check (`"string"`, `"object"`, `"array"`, etc.) |
| `JSONPath` | `JSONPath(obj, path, expected, msg?)` | Extract JSON path and compare |
| `Panic` | `Panic(fn, msg?)` | Assert function throws |
| `NoPanic` | `NoPanic(fn, msg?)` | Assert function does not throw |
| `Error` | `Error(err, msg?)` | Assert error is non-nil |
| `NoError` | `NoError(err, msg?)` | Assert error is nil |
| `Agent` | `Agent(response, agentID, opts?)` | Use a validator agent |

**Test control methods on `t`:**

| Method | Description |
|--------|-------------|
| `t.log(...args)` | Log message (shown in verbose mode) |
| `t.error(...args)` | Record error and mark test as failed |
| `t.fail(reason?)` | Mark test as failed |
| `t.fatal(reason?)` | Mark test as failed and stop execution |
| `t.skip(reason?)` | Skip the test |

---

## 4. Agent Tests (E2E with LLM)

Test full agent conversations including LLM calls, tools, and hooks.

### Direct Message Mode

Quick test during development -- sends a single message:

```bash
# Test from agent directory (auto-detects agent from cwd)
cd assistants/yao/keeper
yao-dev agent test -i "Hello, help me save a webpage"

# Test with explicit agent
yao-dev agent test -n yao.keeper -i "Hello" -v
```

### JSONL File Mode

Structured test cases in `.jsonl` format:

```jsonl
{"id": "T001", "input": "Hello", "assert": {"type": "contains", "value": "hello"}}
{"id": "T002", "input": [{"role": "user", "content": "Classify this"}], "assert": {"type": "type", "value": "string"}}
{"id": "T003", "input": "Bad input", "assert": {"type": "contains", "value": "error"}, "skip": true}
```

```bash
yao-dev agent test -n yao.keeper -i tests/cases.jsonl -v
```

### Assertion Types in JSONL

| Type | Value | Description |
|------|-------|-------------|
| `contains` | string | Output contains value |
| `not_contains` | string | Output does not contain |
| `equals` | any | Exact match |
| `regex` | string | Regex pattern match |
| `type` | string | Output type check |
| `json_path` | any | JSON path extraction + comparison |
| `schema` | object | JSON schema validation |
| `script` | string | Custom script validation |
| `agent` | string | Agent-driven validation |

### JSONL Per-Test Options

Each test case in JSONL can override:

```jsonl
{
  "id": "T001",
  "input": "Hello",
  "user": "custom-user",
  "team": "custom-team",
  "timeout": "60s",
  "metadata": {"mode": "task"},
  "options": {
    "connector": "gpt-4o",
    "mode": "task",
    "skip": {"history": true, "search": true}
  },
  "before": "scripts:tests.env.Before",
  "after": "scripts:tests.env.After"
}
```

---

## 5. CLI Flags Reference

| Flag | Description | Default |
|------|-------------|---------|
| `-n` | Agent ID (e.g. `yao.keeper`) | Auto-detect from path/cwd |
| `-i` | Input: message, JSONL file, or `scripts.X.Y` | Required |
| `-v` | Verbose output | false |
| `-u` | User ID for test context | `test-user` |
| `-t` | Team ID for test context | `test-team` |
| `--ctx` | Path to context JSON file | -- |
| `--run` | Regex filter for test names | -- |
| `-c` | Override connector | Agent default |
| `-o` | Output report file (.json/.html/.md) | -- |
| `-r` | Reporter agent ID | Default JSONL |
| `--timeout` | Per-test timeout | 120s |
| `--parallel` | Number of parallel tests | 1 |
| `--runs` | Runs per test (stability analysis) | 1 |
| `--fail-fast` | Stop on first failure | false |
| `--dry-run` | Generate test cases without running | false |
| `--before-all` | Global before script | -- |
| `--after-all` | Global after script | -- |

---

## 6. Test Patterns

### Accessing Team ID from Context

```typescript
function teamId(ctx: agent.Context): string {
  return ctx.authorized?.team_id || "team-001";
}

export function TestSomething(t: testing.T, ctx: agent.Context) {
  const tid = teamId(ctx);
  // Use tid for data isolation...
}
```

### Testing Error Cases

```typescript
export function TestSave_MissingTitle(t: testing.T, ctx: agent.Context) {
  let hasError = false;
  try {
    Save(teamId(ctx), { title: "" });
  } catch (e: any) {
    hasError = true;
    t.assert.Contains(e.message, "title is required", "error should mention title");
  }
  t.assert.True(hasError, "should throw when title is empty");
}
```

### Testing Process() Calls

```typescript
export function TestSave_ViaProcess(t: testing.T, ctx: agent.Context) {
  const tid = teamId(ctx);
  const result = Process("agents.yao.keeper.store.Save", tid, {
    title: "Test " + Date.now(),
    content: "content",
  });
  t.assert.True(result.entry_id.length > 0, "should have entry_id");

  // Verify via Get
  const entry = Process("agents.yao.keeper.store.Get", tid, result.entry_id);
  t.assert.Equal(entry.content, "content", "persisted content should match");

  // Cleanup
  Process("agents.yao.keeper.store.Archive", tid, result.entry_id);
}
```

### Testing MCP Adapters

```typescript
// MCP adapters use Authorized() internally -- ctx.json provides the identity
export function TestMCPSave(t: testing.T, ctx: agent.Context) {
  const result = MCPSave({ title: "MCP Test " + Date.now(), content: "test" });
  t.assert.True(result.entry_id.length > 0, "should create entry");

  const entry = MCPGet({ entry_id: result.entry_id });
  t.assert.Equal(entry.title, result.title, "title should match");

  MCPArchive({ entry_id: result.entry_id });
}
```

### Cleanup Pattern

Always clean up test data to avoid polluting subsequent runs:

```typescript
export function TestWithCleanup(t: testing.T, ctx: agent.Context) {
  const tid = teamId(ctx);
  const saved = Save(tid, { title: "Cleanup Test " + Date.now(), content: "tmp" });

  // ... assertions ...

  // Cleanup: archive or delete
  Archive(tid, saved.entry_id);
}
```

---

## 7. Stability Testing

Run each test multiple times to detect flaky behavior:

```bash
yao-dev agent test -n yao.keeper -i tests/cases.jsonl --runs 5 -v
```

Results include per-test stability classification:

| Class | Pass Rate | Description |
|-------|-----------|-------------|
| `stable` | 100% | All runs passed |
| `mostly_stable` | 80-99% | Occasional failures |
| `unstable` | 50-79% | Frequent failures |
| `highly_unstable` | < 50% | Mostly failing |

---

## 8. Source Code Reference

| Topic | File |
|-------|------|
| Test runner | `yao/agent/test/runner.go` |
| Script test runner | `yao/agent/test/script.go` |
| Script path resolver | `yao/agent/test/script.go` (`ResolveScript`) |
| Agent path resolver | `yao/agent/test/resolver.go` |
| Test context builder | `yao/agent/test/context.go` |
| Assertion API (Go) | `yao/agent/test/script_assert.go` |
| Test types and options | `yao/agent/test/types.go` |
| Dynamic test runner | `yao/agent/test/dynamic_runner.go` |
| Test output formatter | `yao/agent/test/output.go` |
