# Frontend API Reference

Complete reference for SUI frontend scripts (`<page>.ts`).

## Component Structure

```typescript
import { $Backend, Component, EventData } from "@yao/sui";

const self = this as Component;

// Component APIs
// self.root     - Root element (HTMLElement)
// self.store    - Data store (data-* attributes)
// self.props    - Props (passed attributes)
// self.state    - State management
// self.constants - Constants from backend
// self.helpers  - Helper functions from backend

// State watchers
self.watch = {
  propertyName: (value: any, state: any) => {
    // React to state changes
    // state.stopPropagation(); // Prevent bubbling
  },
};

// Event handlers (bound to s:on-click="HandleClick")
self.HandleClick = async (event: Event, data: EventData) => {
  // Handle event
};
```

## Backend Calls

### $Backend

```typescript
import { $Backend } from "@yao/sui";

// Call backend API methods
const users = await $Backend().Call("GetUsers");
const user = await $Backend().Call("GetUser", 123);
const result = await $Backend().Call("CreateUser", "John", "john@example.com");
```

### Direct Call

```typescript
// __sui_backend_call(route, headers, method, ...args)
const result = await __sui_backend_call(
  "/users/list",                      // Page route
  { "X-Custom-Header": "value" },     // Custom headers
  "GetUsers",                         // Method name
  { page: 1, limit: 10 }              // Arguments
);
```

## Component Query

### $$() Function

```typescript
// By ID
const card = $$("#my-card");

// By element
const element = document.querySelector(".card");
const card = $$(element);

// Access component methods
card.toggle();
card.state.Set("expanded", true);
```

### Query Methods

```typescript
const component = $$("#my-component");

// Find child component (returns __Query wrapper)
const button = component.find("button");

// Query single element
const title = component.query(".title");

// Query all elements
const items = component.queryAll(".item");
```

## Store API

Manages `data-*` attributes on the component:

```typescript
const self = this as Component;

// String values
const id = self.store.Get("id");
self.store.Set("id", "123");

// JSON values
const items = self.store.GetJSON("items");
self.store.SetJSON("items", [{ id: 1 }, { id: 2 }]);

// Component data (from BeforeRender)
const data = self.store.GetData();
```

## Props API

```typescript
const self = this as Component;

// Get single prop
const value = self.props.Get("propName");

// Get all props
const props = self.props.List();
// { name: "John", email: "john@example.com", role: "admin" }
```

## State API

```typescript
const self = this as Component;

// Set state (triggers watchers)
self.state.Set("count", 10);
self.state.Set("items", [{ id: 1 }]);

// Get state
const count = self.state.Get("count");

// Watch state changes
self.watch = {
  count: (value: number, state: any) => {
    self.root.querySelector(".count")!.textContent = String(value);
    // state.stopPropagation(); // Prevent bubbling to parent
  },
  items: (items: any[]) => {
    renderItems(items);
  },
};
```

## Render API

### HTML Target

```html
<div s:render="userList" class="user-list">
  <!-- Content will be replaced here -->
</div>
```

### Render Method

```typescript
self.RefreshUsers = async () => {
  const users = await $Backend().Call("GetUsers");
  await self.render("userList", { users });
};

// With options
await self.render("targetName", data, {
  replace: true,         // Replace content (default: true)
  showLoader: true,      // Show loading indicator
  withPageData: true,    // Include page data in render context
  route: "/custom/route", // Use custom route for rendering
});
```

## Custom Events

### Emit

```typescript
self.Select = () => {
  self.emit("card:selected", { id: self.store.Get("id") });
};
```

### Listen

```typescript
self.root.addEventListener("card:selected", (e: CustomEvent) => {
  console.log("Selected:", e.detail.id);
});

// State change events
self.root.addEventListener("state:change", (e: CustomEvent) => {
  const { key, value, target } = e.detail;
  console.log(`${key} = ${value}`);
});
```

## OpenAPI Client

```typescript
const api = new OpenAPI({ baseURL: "/api" });

// GET
const response = await api.Get<User[]>("/users");

// POST
const response = await api.Post<User>("/users", { name: "John" });

// PUT
const response = await api.Put<User>("/users/123", { name: "Updated" });

// DELETE
const response = await api.Delete<void>("/users/123");

// Error handling
if (api.IsError(response)) {
  console.error(response.error.error_description);
  return;
}
const users = response.data;

// Cross-origin
if (api.IsCrossOrigin()) {
  api.SetCSRFToken(token);
}
api.ClearTokens();
```

## File API

```typescript
const api = new OpenAPI({ baseURL: "/api" });
const fileApi = new FileAPI(api);

// Upload with progress
const response = await fileApi.Upload(
  file,
  { path: "documents", compressImage: true },
  (progress) => console.log(`${progress.percentage}%`)
);

// Upload multiple
const responses = await fileApi.UploadMultiple(
  files,
  { path: "uploads" },
  (fileIndex, progress) => console.log(`File ${fileIndex}: ${progress.percentage}%`)
);

// List files
const files = await fileApi.List({
  page: 1,
  pageSize: 20,
  contentType: "image/*",
});

// Get file info
const info = await fileApi.Retrieve("file-id");

// Download
const blob = await fileApi.Download("file-id");
if (!api.IsError(blob)) {
  window.open(URL.createObjectURL(blob.data));
}

// Delete
await fileApi.Delete("file-id");

// Utilities
FileAPI.FormatSize(1048576);         // "1 MB"
FileAPI.GetExtension("doc.pdf");     // "pdf"
FileAPI.IsImage("image/png");        // true
```

## Yao SDK (Legacy)

```typescript
const yao = new Yao();

// HTTP requests
const data = await yao.Get("/api/users", { page: 1 });
const result = await yao.Post("/api/users", { name: "John" });

// Download
await yao.Download("/api/export", { format: "csv" }, "export.csv");

// Token management
const token = yao.Token();
yao.SetCookie("key", "value", 30);  // 30 days
yao.DeleteCookie("key");
```

## CUI Integration

When SUI pages are embedded in CUI via `/web/` routes:

### URL Parameters

| Value      | Replaced With                    |
| ---------- | -------------------------------- |
| `__theme`  | Current theme (`light` / `dark`) |
| `__locale` | Current locale (e.g., `en-us`)   |

### Receive Messages

```typescript
window.addEventListener("message", (e) => {
  if (e.origin !== window.location.origin) return;

  const { type, message } = e.data;
  switch (type) {
    case "setup":
      document.documentElement.setAttribute("data-theme", message.theme);
      break;
    case "update":
      handleUpdate(message);
      break;
  }
});
```

### Send Actions

```typescript
const sendAction = (name: string, payload?: any) => {
  window.parent.postMessage(
    { type: "action", message: { name, payload } },
    window.location.origin
  );
};

// Navigation
sendAction("navigate", { route: "/agents/demo/detail", title: "Details" });
sendAction("navigate.back");

// Notifications
sendAction("notify.success", { message: "Done!" });
sendAction("notify.error", { message: "Failed" });
sendAction("notify.warning", { message: "Warning" });
sendAction("notify.info", { message: "Info" });

// App actions
sendAction("app.menu.reload");
sendAction("event.emit", { key: "app/closeSidebar", value: {} });

// Table actions
sendAction("table.search", { keywords: "search" });
sendAction("table.refresh");

// Form actions
sendAction("form.submit");
sendAction("form.reset");

// Modal actions
sendAction("modal.open", { ... });
sendAction("modal.close");

// Confirm dialog
sendAction("confirm", { title: "Confirm", content: "Are you sure?" });
```

## Event Handler Signature

```typescript
interface EventData {
  [key: string]: any;  // Data from s:data-* and s:json-* attributes
}

self.HandleClick = (event: Event, data: EventData) => {
  // event - The DOM event
  // data - Combined data from s:data-* and s:json-*
};
```

## Complete Example

```typescript
import { $Backend, Component, EventData } from "@yao/sui";

const self = this as Component;

// Initialize API
const api = new OpenAPI({ baseURL: "/api" });
const fileApi = new FileAPI(api);

// State watchers
self.watch = {
  users: (users: any[]) => self.render("userList", { users }),
  loading: (loading: boolean) => {
    self.root.classList.toggle("loading", loading);
  },
};

// Load users
async function loadUsers() {
  self.state.Set("loading", true);
  const response = await api.Get<User[]>("/users");
  if (!api.IsError(response)) {
    self.state.Set("users", response.data);
  }
  self.state.Set("loading", false);
}

// Create user
self.CreateUser = async (event: Event, data: EventData) => {
  const response = await $Backend().Call("CreateUser", data.name, data.email);
  const users = self.state.Get("users");
  self.state.Set("users", [...users, response]);
};

// Upload avatar
self.UploadAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files![0];
  const response = await fileApi.Upload(file, { path: "avatars" });
  if (!api.IsError(response)) {
    self.emit("avatar:uploaded", { url: response.data.url });
  }
};

// Initialize
loadUsers();
```
