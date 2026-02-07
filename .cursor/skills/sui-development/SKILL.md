---
name: sui-development
description: Guide for developing web applications using Yao SUI framework. Use when building SUI pages, components, templates, handling data binding, event handling, backend scripts, routing, i18n, or integrating with CUI. Trigger when user mentions SUI, Yao web development, page templates, or frontend/backend integration in Yao applications.
---

# SUI Development Guide

SUI (Simple UI) is Yao's built-in web framework for building server-rendered pages with reactive components.

## Core Concepts

1. **File-based routing** - Directory structure defines URL routes
2. **Page = Component** - Every page can be used as a component
3. **Server-side rendering** - Templates rendered on server with data binding
4. **Progressive enhancement** - Frontend scripts add interactivity

## Directory Structure

```
/suis/<sui>/templates/<template>/
├── __document.html       # Global document wrapper
├── __data.json           # Global data ($global)
├── __assets/             # Static assets
├── __locales/            # i18n files
└── pages/
    └── <page>/           # Route = folder name
        ├── <page>.html   # Template
        ├── <page>.css    # Styles (auto-scoped)
        ├── <page>.ts     # Frontend script
        ├── <page>.json   # Page data config
        ├── <page>.config # Page settings (guard, cache, SEO)
        └── <page>.backend.ts  # Server-side logic
```

## Build Commands

```bash
yao sui build <sui> <template>      # Build for production
yao sui build <sui> <template> -D   # Development mode
yao sui watch <sui> <template>      # Watch mode
yao sui trans <sui> <template>      # Extract i18n strings
```

---

# Template Syntax

## Data Interpolation

```html
{{ name }}                    <!-- Variable -->
{{ user.email }}              <!-- Nested -->
{{ title ?? 'Default' }}      <!-- Default value -->
{{ price * quantity }}        <!-- Expression -->
{{ count > 0 ? 'Yes' : 'No' }} <!-- Ternary -->
```

## Conditionals

```html
<div s:if="{{ isActive }}">Active</div>
<div s:elif="{{ isPending }}">Pending</div>
<div s:else>Unknown</div>

<!-- Operators: ==, !=, >, <, >=, <=, &&, ||, ! -->
<div s:if="{{ isAdmin && isActive }}">Admin Panel</div>
```

## Loops

```html
<li s:for="{{ items }}" s:for-item="item" s:for-index="i">
  {{ i + 1 }}. {{ item.name }}
</li>

<!-- With conditional -->
<div s:for="{{ users }}" s:for-item="user" s:if="{{ user.active }}">
  {{ user.name }}
</div>
```

## Attribute Binding

```html
<a href="{{ '/user/' + id }}">Link</a>
<button s:attr-disabled="{{ !valid }}">Submit</button>
<div class="base {{ isActive ? 'active' : '' }}">Content</div>
<div ...props></div>  <!-- Spread -->
```

## Built-in Variables

| Variable   | Description              | Example               |
| ---------- | ------------------------ | --------------------- |
| `$param`   | Route parameters         | `{{ $param.id }}`     |
| `$query`   | URL query params         | `{{ $query.search }}` |
| `$payload` | POST body                | `{{ $payload.name }}` |
| `$global`  | Global data              | `{{ $global.title }}` |
| `$theme`   | Current theme            | `{{ $theme }}`        |
| `$locale`  | Current locale           | `{{ $locale }}`       |
| `$auth`    | OAuth info (when guarded)| `{{ $auth.user_id }}` |

## Built-in Functions

```html
{{ P_('models.user.Find', id) }}   <!-- Call process -->
{{ True(user) }}                    <!-- Truthy check -->
{{ Empty(items) }}                  <!-- Empty check -->
{{ len(items) }}                    <!-- Array length -->
{{ filter(items, .active) }}        <!-- Filter array -->
```

---

# Data Binding

## Page Data (`<page>.json`)

```json
{
  "title": "Static value",
  "$users": "models.user.Get",
  "$user": {
    "process": "models.user.Find",
    "args": ["$param.id"]
  },
  "$items": {
    "process": "@GetItems",
    "args": ["active", 10]
  }
}
```

- Keys with `$` prefix call processes
- `@MethodName` calls backend script functions
- Use `$param`, `$query`, `$payload` in args

## Backend Script (`<page>.backend.ts`)

```typescript
// Called before page render
function BeforeRender(request: Request): Record<string, any> {
  const id = request.params.id;  // NOT $param.id
  return {
    user: Process("models.user.Find", id),
    items: Process("models.item.Get", { limit: 10 }),
  };
}

// API method - called via $Backend().Call("GetUsers")
function ApiGetUsers(request: Request): any[] {
  return Process("models.user.Get", {});
}

// Called from .json as "@GetRecord"
function GetRecord(request: Request): any {
  return Process("models.record.Find", request.params.id);
}
```

> **Important**: `$param` is NOT available in backend scripts. Use `request.params`.

---

# Components

Every page is a component. Use `is` attribute or `<import>` to embed:

```html
<!-- Using is attribute -->
<div is="/card" title="My Card">
  <p>Content</p>
</div>

<!-- Using import -->
<import s:as="Card" s:from="/card" />
<Card title="My Card"><p>Content</p></Card>
```

## Component Structure

**`/card/card.html`**:

```html
<div class="card">
  <h3>{{ title }}</h3>
  <div class="body"><children></children></div>
</div>
```

## Named Slots

```html
<!-- Component -->
<div class="modal">
  <div class="header"><slot name="header"></slot></div>
  <div class="body"><children></children></div>
  <div class="footer"><slot name="footer"></slot></div>
</div>

<!-- Usage -->
<div is="/modal">
  <slot name="header"><h2>Title</h2></slot>
  <p>Body content</p>
  <slot name="footer"><button>OK</button></slot>
</div>
```

## Props Access

**Frontend** (`card.ts`):

```typescript
import { Component } from "@yao/sui";
const self = this as Component;

const title = self.props.Get("title");
const allProps = self.props.List();
```

**Backend** (`card.backend.ts`):

```typescript
function BeforeRender(request: Request, props: Record<string, any>): Record<string, any> {
  const userId = props.userId;
  return { user: Process("models.user.Find", userId) };
}
```

---

# Event Handling

## Event Binding

```html
<button s:on-click="HandleClick">Click</button>
<input s:on-input="HandleInput" />
<form s:on-submit="HandleSubmit">...</form>

<!-- With data -->
<button s:on-click="DeleteItem" s:data-id="{{ item.id }}" s:json-item="{{ item }}">
  Delete
</button>
```

## Event Handler

```typescript
import { $Backend, Component, EventData } from "@yao/sui";

const self = this as Component;

self.DeleteItem = async (event: Event, data: EventData) => {
  const id = data.id;           // From s:data-id
  const item = data.item;       // From s:json-item
  
  await $Backend().Call("DeleteItem", id);
  (event.target as HTMLElement).closest(".item")?.remove();
};

self.HandleSubmit = async (event: Event) => {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  await $Backend().Call("Submit", Object.fromEntries(formData));
};
```

## State Management

```typescript
const self = this as Component;

// Set state
self.state.Set("count", 0);

// Watch changes
self.watch = {
  count: (value: number) => {
    self.root.querySelector(".count")!.textContent = String(value);
  },
};

// Trigger update
self.Increment = () => {
  const count = self.state.Get("count") || 0;
  self.state.Set("count", count + 1);
};
```

---

# Frontend API

## Backend Calls

```typescript
import { $Backend } from "@yao/sui";

// Calls ApiGetUsers in backend script
const users = await $Backend().Call("GetUsers");
const user = await $Backend().Call("GetUser", 123);
```

## Component Query

```typescript
const card = $$("#my-card");        // Get component by ID
card.toggle();                       // Call method
card.state.Set("expanded", true);   // Set state

const button = component.find("button");   // Find child
const title = component.query(".title");   // Query element
```

## Render API

```html
<div s:render="userList" class="user-list"></div>
```

```typescript
self.RefreshUsers = async () => {
  const users = await $Backend().Call("GetUsers");
  await self.render("userList", { users });
};
```

## OpenAPI Client

```typescript
const api = new OpenAPI({ baseURL: "/api" });

const response = await api.Get<User[]>("/users");
if (!api.IsError(response)) {
  console.log(response.data);
}

await api.Post<User>("/users", { name: "John" });
```

---

# Page Configuration

**`<page>.config`**:

```json
{
  "title": "Page Title",
  "guard": "oauth",
  "cache": 3600,
  "dataCache": 300,
  "seo": {
    "title": "SEO Title",
    "description": "Meta description"
  },
  "api": {
    "defaultGuard": "oauth",
    "guards": {
      "PublicMethod": "-"
    }
  }
}
```

## Guards

| Guard        | Description                   |
| ------------ | ----------------------------- |
| `oauth`      | OAuth 2.1 (recommended)       |
| `bearer-jwt` | Bearer token JWT              |
| `cookie-jwt` | Cookie-based JWT              |
| `-`          | Public (no auth)              |

---

# Routing

## Dynamic Routes

Use `[param]` in folder names:

| Structure               | URL              | Access                    |
| ----------------------- | ---------------- | ------------------------- |
| `/users/[id]/`          | `/users/123`     | `{{ $param.id }}`         |
| `/[category]/[id]/`     | `/news/456`      | `{{ $param.category }}`   |

## URL Rewriting (`app.yao`)

```json
{
  "public": {
    "rewrite": [
      { "^\\/assets\\/(.*)$": "/assets/$1" },
      { "^\\/users\\/([^\\/]+)$": "/users/[id].sui" },
      { "^\\/(.*)$": "/$1.sui" }
    ]
  }
}
```

---

# Internationalization

## Translation Markers

```html
<span s:trans>Hello World</span>
<span>{{ '::Welcome' }}</span>
```

```typescript
const message = __m("Welcome back");
```

## Locale Files

**`__locales/zh-cn/home.yml`**:

```yaml
name: zh-cn
direction: ltr
messages:
  Hello World: 你好世界
  Welcome: 欢迎
script_messages:
  "Welcome back": "欢迎回来"
```

---

# Agent SUI

Special configuration for AI Agent apps. Loads from `/agent/template/` and `/assistants/<name>/pages/`.

## Route Mapping

| File Path                                    | Public URL               |
| -------------------------------------------- | ------------------------ |
| `/agent/template/pages/login/login.html`     | `/agents/login`          |
| `/assistants/demo/pages/index/index.html`    | `/agents/demo/index`     |

## Build

```bash
yao sui build agent
yao sui watch agent
```

## CUI Integration

```typescript
// Receive context from CUI
window.addEventListener("message", (e) => {
  if (e.data.type === "setup") {
    const { theme, locale } = e.data.message;
    document.documentElement.setAttribute("data-theme", theme);
  }
});

// Send actions to CUI
const sendAction = (name: string, payload?: any) => {
  window.parent.postMessage(
    { type: "action", message: { name, payload } },
    window.location.origin
  );
};

sendAction("notify.success", { message: "Done!" });
sendAction("navigate", { route: "/agents/demo/detail", title: "Details" });
```

---

# Quick Reference

## Common Patterns

**Protected page with API**:

```json
// page.config
{ "guard": "oauth", "api": { "defaultGuard": "oauth" } }
```

**List with delete**:

```html
<div s:for="{{ items }}" s:for-item="item">
  {{ item.name }}
  <button s:on-click="Delete" s:data-id="{{ item.id }}">×</button>
</div>
```

```typescript
self.Delete = async (e: Event, data: EventData) => {
  await $Backend().Call("DeleteItem", data.id);
  (e.target as HTMLElement).closest("div")?.remove();
};
```

**Form submission**:

```html
<form s:on-submit="Submit">
  <input name="email" type="email" required />
  <button type="submit">Submit</button>
</form>
```

```typescript
self.Submit = async (e: Event) => {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  await $Backend().Call("Save", Object.fromEntries(new FormData(form)));
};
```

## File Reference

| File                | Purpose                     |
| ------------------- | --------------------------- |
| `<page>.html`       | Template                    |
| `<page>.css`        | Styles (auto-scoped)        |
| `<page>.ts`         | Frontend script             |
| `<page>.json`       | Data configuration          |
| `<page>.config`     | Page settings               |
| `<page>.backend.ts` | Server-side logic           |
| `__document.html`   | Global wrapper              |
| `__data.json`       | Global data                 |
| `__locales/`        | i18n translations           |
| `__assets/`         | Static files                |
