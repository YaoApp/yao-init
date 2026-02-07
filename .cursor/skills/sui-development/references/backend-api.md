# Backend Script API Reference

Complete reference for SUI backend scripts (`<page>.backend.ts`).

## File Structure

```typescript
// Constants exported to frontend
const __sui_constants = {
  MAX_ITEMS: 100,
  API_URL: "/api/v1",
};

// Helper functions exported to frontend
const __sui_helpers = ["formatDate", "formatCurrency"];

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString();
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// Called before page render
function BeforeRender(request: Request, props?: Record<string, any>): Record<string, any> {
  return { /* data for template */ };
}

// API methods (callable from frontend)
function ApiMethodName(arg1: any, arg2: any, request: Request): any {
  return { /* result */ };
}

// Data binding methods (called from .json)
function MethodName(request: Request): any {
  return { /* result */ };
}
```

## Request Object

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

## BeforeRender

Called before the page is rendered. Data returned is merged with page data.

```typescript
function BeforeRender(request: Request, props?: Record<string, any>): Record<string, any> {
  // Access route parameters
  const userId = request.params.id;
  
  // Access query parameters
  const page = parseInt(request.query.page) || 1;
  
  // Access POST payload
  const formData = request.payload;
  
  // Access headers
  const token = request.headers["Authorization"];
  
  // Access session
  const sessionId = request.sid;
  
  // When used as component, access props
  const propValue = props?.someProp;
  
  return {
    user: Process("models.user.Find", userId),
    items: Process("models.item.Get", { page, pageSize: 10 }),
  };
}
```

## API Methods

Functions prefixed with `Api` are exposed as callable endpoints. Frontend calls use the method name without the prefix.

```typescript
// Backend: ApiGetUsers
// Frontend: $Backend().Call("GetUsers")
function ApiGetUsers(request: Request): any[] {
  return Process("models.user.Get", {});
}

// Backend: ApiCreateUser
// Frontend: $Backend().Call("CreateUser", name, email)
function ApiCreateUser(name: string, email: string, request: Request): any {
  return Process("models.user.Create", { name, email });
}

// Backend: ApiUpdateUser
// Frontend: $Backend().Call("UpdateUser", id, data)
function ApiUpdateUser(id: string, data: any, request: Request): any {
  // Request is always the last argument
  const sessionUser = Process("session.Get", "user");
  if (!sessionUser) {
    throw new Error("Not authenticated");
  }
  return Process("models.user.Save", id, data);
}
```

## Data Binding Methods

Methods called from `.json` configuration using `@MethodName` syntax:

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
// Arguments from .json come first, request is appended last
function GetItems(status: string, limit: number, request: Request): any[] {
  return Process("models.item.Get", {
    wheres: [{ column: "status", value: status }],
    limit: limit,
  });
}
```

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

// Flows
const output = Process("flows.myflow", input);
```

## Error Handling

```typescript
function ApiUpdateUser(id: string, data: any, request: Request): any {
  try {
    const user = Process("models.user.Find", id);
    if (!user) {
      throw new Error("User not found");
    }
    return Process("models.user.Save", id, data);
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
```

## Important Notes

1. **No ES Module Exports**: Backend scripts do NOT support `export` syntax. Define functions directly.

2. **`$param` Not Available**: Unlike HTML templates, you cannot use `$param.id` in backend scripts. Use `request.params.id`.

3. **Request is Last Argument**: For API methods and data binding methods, the `request` object is always appended as the last argument.

4. **Naming Conventions**:
   | Call Source                  | Function Name   | Example Call                    |
   | ---------------------------- | --------------- | ------------------------------- |
   | Frontend `$Backend().Call()` | `ApiMethodName` | `$Backend().Call("MethodName")` |
   | `.json` data binding         | `MethodName`    | `"$data": "@MethodName"`        |
   | Before render                | `BeforeRender`  | Automatic                       |
