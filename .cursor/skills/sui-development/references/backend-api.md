# Backend Script API Reference

Complete reference for SUI backend scripts (`<page>.backend.ts`).

## File Structure

```typescript
const __sui_constants = {
  MAX_ITEMS: 100,
  API_URL: "/api/v1",
};

const __sui_helpers = ["formatDate", "formatCurrency"];

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function BeforeRender(request: Request, props?: Record<string, any>): Record<string, any> {
  return { /* data for template */ };
}

function ApiMethodName(arg1: any, arg2: any): any {
  return { /* result */ };
}

function MethodName(request: Request): any {
  return { /* result */ };
}
```

---

## Authentication & Authorization (CRITICAL)

SUI backend scripts have **two different authentication mechanisms** depending on how the
function is called. Getting this wrong is the #1 source of "unauthorized" errors.

### The `Authorized()` Global Function

SUI's V8 runtime provides a built-in global function `Authorized()` that returns the
current user's authentication info. It reads from the V8 context's share data, which is
populated by the guard system.

```typescript
interface AuthorizedInfo {
  sub?: string;
  user_id?: string;
  team_id?: string;
  tenant_id?: string;
  owner_id?: string;
  client_id?: string;
  session_id?: string;
  scope?: string;
  remember_me?: boolean;
  constraints?: {
    owner_only?: boolean;
    creator_only?: boolean;
    editor_only?: boolean;
    team_only?: boolean;
    extra?: Record<string, any>;
  };
}

declare function Authorized(): AuthorizedInfo | null;
```

### How Auth Works for Each Function Type

| Function Type | Called By | How Auth Info Is Available |
|---|---|---|
| `@FuncName` (data binding from `.json`) | SUI page render | `request.authorized` (request object is appended as last arg) |
| `BeforeRender` | SUI page render | `request.authorized` (request object is the first arg) |
| `ApiFuncName` | `$Backend().Call("FuncName", ...)` | **`Authorized()` global function ONLY** |

### CRITICAL: `ApiXxx` Functions and `$Backend().Call`

When the frontend calls `$Backend().Call("FuncName", arg1, arg2)`, it triggers `sui.Run`
in the Go runtime. The execution flow is:

1. `Run()` creates a `RequestContext` — `r.Authorized` is empty at this point
2. `Run()` calls `r.apiGuard(method, cfg.API)` — this executes the OAuth guard
3. The guard (e.g. `guardOAuth`) validates the token and sets `r.Authorized`
4. `Run()` calls `scriptCtx.WithAuthorized(r.Authorized)` — injects auth into V8 context
5. `Run()` calls `scriptCtx.Call("ApiFuncName", args...)` — **only frontend args are passed**

The `request` object is **NOT** passed as a parameter to `ApiXxx` functions. The args
received are exactly what the frontend sent. Auth info is available via `Authorized()`.

```typescript
// CORRECT — use Authorized() global function
function ApiCreateKey(name: string) {
  const auth = Authorized();
  const userId = String(auth?.user_id || "");
  if (!userId) throw new Error("unauthorized");

  // ... business logic using userId ...
  return { key: "created" };
}

// WRONG — request is NOT passed to ApiXxx by $Backend().Call
function ApiCreateKey(name: string, request: Request) {
  const userId = request.authorized?.user_id; // ← undefined! request is not injected
}
```

### `@FuncName` Data Binding Functions

When called from `.json` via `@FuncName`, the SUI core (`script.go`) appends the `request`
object as the last argument. These functions DO receive `request.authorized`.

```typescript
// Called from .json as "@GetItems"
// Args from .json come first, request is appended last by SUI core
function GetItems(status: string, limit: number, request: Request): any[] {
  const userId = request.authorized?.user_id; // ✓ Works
  return Process("models.item.Get", {
    wheres: [{ column: "status", value: status }],
    limit: limit,
  });
}
```

### The `api` Config Requirement (CRITICAL)

For `Authorized()` to work in `ApiXxx` functions, the page config MUST include an `api`
section with a guard. Without it, `apiGuard()` sees `cfg.API == nil`, skips authentication
entirely, and `Authorized()` returns null.

```json
{
  "title": "My Page",
  "guard": "oauth:/login",
  "api": {
    "defaultGuard": "oauth"
  }
}
```

- `"guard"` — protects the **page render** (HTML response). Can include redirect: `"oauth:/login"`
- `"api.defaultGuard"` — protects **`$Backend().Call` API calls**. MUST be set separately.

**Common mistake**: Setting only `"guard"` but not `"api"`. The page renders fine (guard
runs during page load), but `$Backend().Call` returns unauthorized because `apiGuard` has
no config.

### Per-Method Guard Override

You can override the guard for specific API methods:

```json
{
  "guard": "oauth:/login",
  "api": {
    "defaultGuard": "oauth",
    "guards": {
      "PublicMethod": "-",
      "AdminMethod": "oauth"
    }
  }
}
```

`"-"` means no authentication required for that method.

### Recommended Pattern for `ApiXxx` Functions

```typescript
interface AuthorizedInfo {
  user_id?: string;
  email?: string;
  team_id?: string;
  owner_id?: string;
}
declare function Authorized(): AuthorizedInfo | null;

function getUserID(): string {
  const auth = Authorized();
  const userId = auth?.user_id || "";
  if (!userId) throw new Error("unauthorized");
  return userId;
}

function ApiGetItems() {
  const userId = getUserID();
  return Process("models.item.Get", {
    wheres: [{ column: "user_id", value: userId }],
  });
}

function ApiCreateItem(data: Record<string, any>) {
  const userId = getUserID();
  return Process("models.item.Create", { ...data, user_id: userId });
}

function ApiDeleteItem(id: string) {
  const userId = getUserID();
  // Verify ownership before delete
  const item = Process("models.item.Find", id);
  if (item?.user_id !== userId) throw new Error("forbidden");
  Process("models.item.Delete", id);
  return { success: true };
}
```

---

## Request Object

The `Request` object is available in `BeforeRender`, `@FuncName` data binding, and page
render functions. It is **NOT** passed to `ApiXxx` functions called via `$Backend().Call`.

```typescript
interface Request {
  method: string;
  url: {
    path: string;
    host: string;
    domain: string;
    scheme: string;
  };
  query: Record<string, string>;
  params: Record<string, string>;
  payload: Record<string, any>;
  headers: Record<string, string>;
  sid: string;
  theme: string;
  locale: string;
  authorized?: {
    sub?: string;
    user_id?: string;
    team_id?: string;
    tenant_id?: string;
    client_id?: string;
    session_id?: string;
    scope?: string;
    remember_me?: boolean;
    constraints?: {
      owner_only?: boolean;
      creator_only?: boolean;
      editor_only?: boolean;
      team_only?: boolean;
      extra?: Record<string, any>;
    };
  };
}
```

---

## BeforeRender

Called before the page is rendered. Data returned is merged with page data.

```typescript
function BeforeRender(request: Request, props?: Record<string, any>): Record<string, any> {
  const userId = request.params.id;
  const page = parseInt(request.query.page) || 1;
  const formData = request.payload;
  const token = request.headers["Authorization"];
  const sessionId = request.sid;
  const propValue = props?.someProp;

  return {
    user: Process("models.user.Find", userId),
    items: Process("models.item.Get", { page, pageSize: 10 }),
  };
}
```

---

## API Methods

Functions prefixed with `Api` are exposed as callable endpoints via `$Backend().Call`.
Frontend calls use the method name **without** the `Api` prefix.

**Auth info comes from `Authorized()`, NOT from a request parameter.**

```typescript
declare function Authorized(): AuthorizedInfo | null;

// Frontend: $Backend().Call("GetUsers")
// Backend receives: ApiGetUsers()  — no arguments
function ApiGetUsers(): any[] {
  const auth = Authorized();
  if (!auth?.user_id) throw new Error("unauthorized");
  return Process("models.user.Get", {
    wheres: [{ column: "user_id", value: auth.user_id }],
  });
}

// Frontend: $Backend().Call("CreateUser", name, email)
// Backend receives: ApiCreateUser("John", "john@example.com")
function ApiCreateUser(name: string, email: string): any {
  const auth = Authorized();
  if (!auth?.user_id) throw new Error("unauthorized");
  return Process("models.user.Create", { name, email, created_by: auth.user_id });
}

// Frontend: $Backend().Call("DeleteItem", itemId)
// Backend receives: ApiDeleteItem("abc123")
function ApiDeleteItem(id: string): any {
  const auth = Authorized();
  if (!auth?.user_id) throw new Error("unauthorized");
  Process("models.item.Delete", id);
  return { success: true };
}
```

---

## Data Binding Methods

Methods called from `.json` configuration using `@MethodName` syntax.
These DO receive the `request` object as the last argument (appended by SUI core).

```json
{
  "$record": "@GetRecord",
  "$items": {
    "process": "@GetItems",
    "args": ["active", 20]
  }
}
```

```typescript
// Called as: GetRecord(request)
function GetRecord(request: Request): any {
  const id = request.params.id;
  return Process("models.record.Find", id);
}

// Called as: GetItems("active", 20, request)
function GetItems(status: string, limit: number, request: Request): any[] {
  return Process("models.item.Get", {
    wheres: [{ column: "status", value: status }],
    limit: limit,
  });
}
```

---

## Constants Export

Export constants to frontend using `__sui_constants`:

```typescript
const __sui_constants = {
  API_URL: "/api/v1",
  MAX_ITEMS: 100,
  SUPPORTED_FORMATS: ["jpg", "png", "gif"],
  CONFIG: {
    timeout: 5000,
    retries: 3,
  },
};
```

Access in frontend:

```typescript
import { Component } from "@yao/sui";
const self = this as Component;

console.log(self.constants.API_URL);      // "/api/v1"
console.log(self.constants.MAX_ITEMS);    // 100
```

---

## Helpers Export

Export helper functions to frontend using `__sui_helpers`:

```typescript
const __sui_helpers = ["formatDate", "formatCurrency", "validateEmail"];

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

Access in frontend:

```typescript
const self = this as Component;

const formatted = self.helpers.formatDate("2024-01-15");
const price = self.helpers.formatCurrency(99.99);
const isValid = self.helpers.validateEmail("test@example.com");
```

---

## Process Calls

Use `Process()` to call Yao processes:

```typescript
// Model operations
const users = Process("models.user.Get", { limit: 10 });
const user = Process("models.user.Find", userId);
Process("models.user.Save", userId, { name: "Updated" });
Process("models.user.Delete", userId);

// Pagination
const result = Process("models.user.Paginate", {
  wheres: [{ column: "active", value: true }],
  orders: [{ column: "created_at", option: "desc" }],
  page: 1,
  pageSize: 20,
});

// Custom scripts
const result = Process("scripts.utils.calculate", arg1, arg2);

// Session
const sessionUser = Process("session.Get", "user");
Process("session.Set", "key", "value");

// Environment variables
const apiKey = Process("utils.env.Get", "API_KEY");

// Flows
const output = Process("flows.myflow", input);
```

---

## Error Handling

```typescript
function ApiUpdateUser(id: string, data: any): any {
  const auth = Authorized();
  if (!auth?.user_id) throw new Error("unauthorized");

  try {
    const user = Process("models.user.Find", id);
    if (!user) {
      throw new Error("User not found");
    }
    if (user.user_id !== auth.user_id) {
      throw new Error("forbidden");
    }
    return Process("models.user.Save", id, data);
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
```

---

## Important Notes

1. **No ES Module Exports**: Backend scripts do NOT support `export` syntax. Define functions directly.

2. **`$param` Not Available**: Unlike HTML templates, you cannot use `$param.id` in backend scripts. Use `request.params.id` (in `BeforeRender`/`@FuncName`) or route the param through `$Backend().Call` args.

3. **`Authorized()` for `ApiXxx`**: API methods called via `$Backend().Call` MUST use the `Authorized()` global function for auth info. The `request` object is NOT passed as a parameter.

4. **`request` for `@FuncName`**: Data binding methods and `BeforeRender` DO receive the `request` object (appended by SUI core as the last argument).

5. **`api` config required**: The page `.config` file MUST include `"api": { "defaultGuard": "oauth" }` for `Authorized()` to work in `ApiXxx` functions. Without it, no authentication runs for API calls.

6. **Naming Conventions**:

   | Call Source | Function Name | Auth Method | Example |
   |---|---|---|---|
   | `$Backend().Call()` | `ApiFuncName` | `Authorized()` | `$Backend().Call("GetUsers")` → `ApiGetUsers()` |
   | `.json` data binding | `FuncName` | `request.authorized` | `"@GetItems"` → `GetItems(...args, request)` |
   | Page render | `BeforeRender` | `request.authorized` | Auto-called with `(request, props?)` |

7. **Go Runtime Source** (for deep debugging):
   - `$Backend().Call` → `yao/sui/api/run.go` → `Run()` → `scriptCtx.Call(prefix+method, args...)`
   - `@FuncName` data binding → `yao/sui/core/script.go` → `Script.Call()` → `args = append(args, r)`
   - Guard execution → `yao/sui/api/run.go` → `apiGuard()` → `guards.go` → `guardOAuth()`
   - `Authorized()` JS function → `gou/runtime/v8/functions/authorized/authorized.go` → reads `share.Authorized`
   - `WithAuthorized()` → `gou/runtime/v8/context.go` → sets `context.Authorized`, used in `Call()` → `SetShareData()`
