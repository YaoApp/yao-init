# SUI Framework — Developer Guide

> Practical reference for building web pages in Yao applications using SUI.
> Covers architecture, component system, APIs, data flow, and known pitfalls.

---

## 1. Architecture Overview

SUI (Simple UI) is Yao's built-in frontend framework for agent pages. It compiles `.html` + `.ts` + `.css` into standalone pages served at `/agents/{assistant_id}/{page_name}`.

**Key characteristics:**

- **No build step required** — Yao compiles TypeScript via esbuild at serve-time (with caching)
- **Component-based** — Reusable components via `<div is="...">` or `<import>` syntax
- **Server-side rendering** — Template expressions (`{{ }}`) render on the server
- **Backend scripts** — `.backend.ts` files provide page-specific APIs
- **No module system** — Scripts execute in global scope (not ES modules)

---

## 2. File Structure

### Page Directory

```
pages/
├── app-nav/                  # Shared component
│   ├── app-nav.html
│   ├── app-nav.css
│   └── app-nav.ts
├── index/                    # Page
│   ├── index.html            # Markup (template expressions + component includes)
│   ├── index.css             # Scoped styles
│   ├── index.ts              # Frontend logic
│   ├── index.backend.ts      # Backend API functions
│   ├── index.config           # Page config (guard, cacheStore, etc.)
│   ├── index.json            # Optional data config for SSR
│   └── __locales/
│       ├── en-us.yml
│       └── zh-cn.yml
└── settings/
    └── ...                   # Same convention
```

### File Roles

| File | Role |
|------|------|
| `{name}.html` | Page markup with template expressions and component slots |
| `{name}.css` | Styles, automatically scoped via namespace |
| `{name}.ts` | Frontend TypeScript — runs in browser, compiled by esbuild |
| `{name}.backend.ts` | Server-side TypeScript — runs in Yao V8 runtime |
| `{name}.config` | Page configuration (guard rules, cache, API settings) |
| `{name}.json` | Data definitions for server-side rendering |
| `__locales/` | i18n translation files (YAML) |

---

## 3. Routing

### Agent SUI Routes

Source path maps to URL:

| Source | URL |
|--------|-----|
| `assistants/yao/keeper/pages/index/` | `/agents/yao.keeper/index` |
| `assistants/yao/keeper/pages/settings/` | `/agents/yao.keeper/settings` |

### Dynamic Routes

Use `[param]` directory segments:

```
pages/entry/[id]/
  └── [id].html    →  /agents/yao.keeper/entry/abc123
```

Access in templates: `{{ $param.id }}`
Access in backend: `request.params.id`

### Cache Busting

Append `?__debug` to the URL to bypass SUI's compiled page cache during development:

```
http://localhost:5099/agents/yao.keeper/settings?__debug
```

---

## 4. Component System

### Defining Components

A component is a directory with `.html` + `.ts` + `.css` files, same as a page.
Components **must have exactly one root element**.

```html
<!-- app-nav/app-nav.html -->
<nav class="app-nav">
  <div class="app-nav-brand">...</div>
  <div class="app-nav-items">...</div>
</nav>
```

### Using Components

**Method 1: `is` attribute (recommended)**

```html
<div is="/yao.keeper/app-nav" active="settings"></div>
```

**Method 2: `<import>` alias**

```html
<import s:as="AppNav" s:from="/app-nav" />
<AppNav active="index" />
```

### Compiled Output

SUI compiles each component's TypeScript into a constructor function registered on `window`:

```javascript
// Component "app-nav" compiles to:
function comp__yao_keeper_app_nav(component) {
  this.root = component;
  const __self = this;
  this.store = new __sui_store(this.root);
  this.state = new __sui_state(this);
  this.props = new __sui_props(this.root);
  this.$root = new __Query(this.root);
  this.find = function(t) { return new __Query(__self.root).find(t) };
  // ... user code ...
}
```

Key points:
- Component name `app-nav` → function name `comp__yao_keeper_app_nav`
- `this.root` = the DOM element with `is="..."` or `s:cn="..."`
- `this.store`, `this.state`, `this.props`, `this.$root`, `this.find`, `this.query`, `this.queryAll`, `this.render`, `this.emit` are auto-injected

### Props

Pass data to components via `prop:` attributes:

```html
<div is="/yao.keeper/app-nav" prop:active="settings" json-attr-prop:items="true" prop:items='[{"label":"Home"}]'></div>
```

Read in component TypeScript:

```typescript
const active = self.props.Get("active");        // string
const items = self.props.Get("items");           // parsed JSON (if json-attr-prop)
const allProps = self.props.List();              // Record<string, any>
```

### Component Attributes

| Attribute | Purpose |
|-----------|---------|
| `s:ns` | Namespace hash for style/script scoping |
| `s:cn` | Component name (maps to `window[cn]`) |
| `s:hash` | Script content hash for cache identity |
| `prop:*` | String property passed to component |
| `json-attr-prop:*` | Marks corresponding `prop:*` as JSON |

---

## 5. Frontend TypeScript

### Execution Context

Page scripts are compiled by esbuild and injected into `<script>` tags. They execute in the **global scope** (not inside a function wrapper). The runtime pre-sets:

```typescript
this.root = document.body;           // For pages (component root for components)
const __self = this;
this.store = new __sui_store(this.root);
this.state = new __sui_state(this);
this.props = new __sui_props(this.root);
this.$root = new __Query(this.root);
```

Access via `const self = this as Component;` at the top of your script.

### Available Runtime Globals

These are provided by `libsui.min.js`:

| Global | Type | Description |
|--------|------|-------------|
| `__Query` | class | DOM query helper (find, findAll, closest, on, each, attr, data, json, prop, addClass, removeClass, toggleClass, hasClass, html) |
| `$$` | function | Component lookup: `$$(element)` or `$$(".selector")` returns `__sui_component` |
| `__sui_store` | class | Element-scoped data store (`Get`, `Set`, `GetJSON`, `SetJSON`, `GetData`) |
| `__sui_state` | class | State management with `watch` handlers and parent propagation |
| `__sui_props` | class | Read `prop:*` and `json-attr-prop:*` attributes |
| `__Render` | class | Partial template rendering |
| `OpenAPI` | class | REST client for Yao OpenAPI endpoints |
| `$Backend()` | function | Backend script caller |

### Event Handling

Bind events via `s:on-*` attributes in HTML:

```html
<button s:on-click="HandleClick" data:id="{{ item.id }}" json:item="{{ item | json }}">
  Click me
</button>
```

Handler in TypeScript:

```typescript
self.HandleClick = (e: Event, data: EventData) => {
  const id = data.id;           // from data:id
  const item = data.item;       // from json:item (parsed)
};
```

**Event data attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `data:key` | string | String value passed to handler as `data.key` |
| `json:key` | any | JSON-parsed value passed to handler as `data.key` |

### State Management

Define `watch` handlers to react to state changes:

```typescript
self.watch = {
  activeTab: (value: string, { target, stopPropagation }) => {
    // React to state change
    renderContent(value);
    // Optionally stop propagation to parent components
    // stopPropagation();
  },
};
```

Trigger state changes:

```typescript
self.state.Set("activeTab", "settings");
```

**Propagation:** State changes bubble up to parent components via `state:change` CustomEvents. Parent components can listen:

```typescript
self.root.addEventListener("state:change", (e: CustomEvent) => {
  const { key, value, target } = e.detail;
  // Handle child state change
});
```

### Store (Element-Scoped Data)

```typescript
// String values
self.store.Set("currentView", "grid");
const view = self.store.Get("currentView");

// JSON values
self.store.SetJSON("filters", { category: "all", sort: "date" });
const filters = self.store.GetJSON("filters");

// Get data from BeforeRender
const pageData = self.store.GetData();
```

---

## 6. Backend Scripts

### Overview

`.backend.ts` files run server-side in the Yao V8 runtime. They have full access to Yao Process API, database models, etc.

### Function Naming Convention

Functions prefixed with `Api` are callable from the frontend:

```typescript
// settings.backend.ts

// Callable from frontend as $Backend().Call("GetIntegrations")
function ApiGetIntegrations(request: Request): any {
  // Full access to Yao Process, models, etc.
  return Process("models.agents.yao.keeper.config.Find", teamId);
}

// Callable from frontend as $Backend().Call("SaveConfig", configData)
function ApiSaveConfig(configData: any, request: Request): any {
  // request is always the last argument
  return Process("models.agents.yao.keeper.config.Save", configData);
}
```

**Important:** The `Api` prefix is automatically prepended. When calling `$Backend().Call("GetIntegrations")`, the runtime calls `ApiGetIntegrations`. The `Request` object is always appended as the last argument.

### BeforeRender

Special function that runs before page rendering, providing server-side data:

```typescript
function BeforeRender(request: Request, props: Record<string, any>): Record<string, any> {
  return {
    title: "Settings",
    items: queryItems(),
  };
}
```

Data returned is available in templates as `{{ title }}` and in frontend via `self.store.GetData()`.

### Calling from Frontend

```typescript
// Frontend TypeScript
const result = await $Backend().Call("GetIntegrations");
```

**Under the hood:**
1. `$Backend()` determines the route from `document.body.getAttribute("s:public")` + pathname
2. `Call()` sends `POST /v1/__yao/sui/v1/run{route}` with `{ method, args }`
3. Server loads `.backend.ts`, calls `Api{method}(args..., request)`

### Available APIs in Backend

Backend scripts run in the Yao V8 runtime with access to:

```typescript
import { Process, Exception, FS, Store, http } from "@yao/runtime";

// Database operations
Process("models.agents.yao.keeper.entry.Get", { wheres, limit, orders });

// HTTP calls
const resp = http.Get("https://api.example.com/data");

// File operations
const fs = new FS("data");
fs.ReadFile("/path/to/file.txt");

// Cache
const cache = new Store("__yao.cache");
cache.GetSet("key", () => expensiveQuery(), 60);
```

---

## 7. OpenAPI Client (Frontend)

The `OpenAPI` class is available globally in SUI pages for calling Yao's REST endpoints:

```typescript
const api = new OpenAPI({ baseURL: "/v1" });

// GET request
const resp = await api.Get("/llm/providers?filters=audio");
if (!api.IsError(resp)) {
  const providers = resp.data;  // Array of { label, value }
}

// POST request
const resp = await api.Post("/some/endpoint", { key: "value" });
```

**Note:** `OpenAPI` is attached to `window.OpenAPI` by `libsui.min.js`. No import needed.

---

## 8. Template Expressions (Server-Side)

### Interpolation

```html
<h1>{{ title }}</h1>
<span>{{ user.name | escape }}</span>
```

### Conditionals

```html
<div s:if="items.length > 0">
  <!-- shown when items exist -->
</div>
<div s:elif="loading">
  <!-- shown when loading -->
</div>
<div s:else>
  <!-- fallback -->
</div>
```

### Loops

```html
<ul>
  <li s:for="items" s:for-item="item" s:for-index="i">
    {{ i + 1 }}. {{ item.name }}
  </li>
</ul>
```

### Filters

```html
{{ content | escape }}
{{ date | format:"2006-01-02" }}
{{ items | json }}
```

---

## 9. i18n (Internationalization)

### Translation Files

```yaml
# __locales/en-us.yml
messages:
  "Settings": "Settings"
  "Integrations": "Integrations"
  "Save": "Save"
  "Click to confirm delete": "Click to confirm delete"
  "entries": "entries"

# __locales/zh-cn.yml
messages:
  "Settings": "设置"
  "Integrations": "集成"
  "Save": "保存"
  "Click to confirm delete": "点击确认删除"
  "entries": "条"
```

**Important:** YAML files must use the `messages:` top-level key. Keys are the English text itself (not slugs like `save_button`).

### Usage in Templates (Server-Side)

```html
<h1>{{ $L "Settings" }}</h1>
```

### Usage in Frontend TypeScript (Runtime)

Use `T()` (alias for `__m()`) imported from `@yao/sui`:

```typescript
import { $Backend, Component, EventData, T } from "@yao/sui";

// String literal keys — extracted by build, always works
const label = T("Click to confirm delete");
countEl.textContent = `${total} ${T("entries")}`;

// Dynamic keys — works as long as the key exists in __locales/*.yml
const name = integration.name; // e.g. "GitHub"
const translated = T(name);   // looks up "GitHub" in __sui_locale
```

**DO NOT** create a custom `I18N` object + `t()` function in your page script. Always use `T()` / `__m()` from the framework.

### How It Works Under the Hood

1. **Build time:** `yao sui build agent` scans `.ts` files for `T("literal")` and `__m("literal")` calls, extracts string keys into `script_messages` in the locale YAML output
2. **Server render:** SUI's Go parser (`parser.go`) merges both `Messages` (from YAML) and `ScriptMessages` (from build extraction) into a single `__sui_locale` JavaScript object injected into the HTML
3. **Runtime:** `T(key)` / `__m(key)` looks up `key` in the `__sui_locale` object; if not found, returns the key as-is (English fallback)

### Pitfalls & Gotchas

#### 1. Dynamic keys work ONLY if defined in YAML

```typescript
// This works — "GitHub" is in zh-cn.yml as '"GitHub": "GitHub"'
const name = T(integration.name);

// This FAILS silently — returns the key unchanged if not in YAML
const mystery = T(someVariable); // If someVariable's value isn't a YAML key, no translation
```

**Rule:** Every possible value of a dynamic key must have a corresponding entry in `__locales/*.yml`. No YAML entry = no translation (silent fallback to the key itself).

#### 2. Keep en-us.yml and zh-cn.yml in sync

Both files must define the same keys. If a key is missing in `en-us.yml`, it still works (falls back to the key text), but for consistency and for any future locale support, always maintain both.

#### 3. Chinese has no plurals — simplify

English has `entry` / `entries`, but Chinese uses a single counter word. Use separate keys:

```typescript
// English: "54 entries" / "1 entry"
// Chinese: "54 条" / "1 条"
countEl.textContent = `${total} ${T("entries")}`;
```

```yaml
# en-us.yml
"entries": "entries"

# zh-cn.yml
"entries": "条"
```

If you need singular/plural in English, use a ternary:

```typescript
`${total} ${total !== 1 ? T("entries") : T("entry")}`;
```

#### 4. `__m()` vs `T()` — use `T()`

Both are identical (`var T = __m` is injected by the framework). `T()` is shorter and more conventional. The build-time regex extracts keys from both `T("...")` and `__m("...")` calls.

---

## 10. Page Configuration

### `{name}.config`

```json
{
  "guard": "bearer-jwt",
  "cacheStore": "",
  "api": {}
}
```

| Field | Description |
|-------|-------------|
| `guard` | Authentication guard (e.g. `bearer-jwt`, `cookie-jwt`) |
| `cacheStore` | Cache store name for compiled output |
| `api` | API configuration |

---

## 11. Known Pitfalls & Best Practices

### CRITICAL: Global Variable Collision with esbuild Polyfills

**This is the most dangerous pitfall in SUI development.**

SUI page scripts (`.ts`) are compiled by esbuild and injected into `<script>` tags **without a function wrapper**. They execute in the global scope. If esbuild generates helper variables (polyfills) for certain TypeScript/ES features, these variables leak into the global scope and can **overwrite** critical variables from `libsui.min.js`, breaking the entire page.

**Root cause:** `libsui.min.js` uses short global variable names like `A`, `F`, `h`, etc. esbuild independently generates polyfill helpers with the **same short names**. Since both run in the global `<script>` scope, the page script's variables overwrite the library's.

**Triggers:** Object spread with property descriptors, class field declarations, and other ES features that esbuild lowers to `Object.defineProperty` / `Object.defineProperties` polyfills.

**Symptom:** `TypeError: Property description must be an object` from `libsui.min.js` → `__Query` constructor → `h()` function, because `h` (or `A`) was overwritten.

**Rules:**

```typescript
// BAD — esbuild generates __spreadProps polyfill with var A=Object.defineProperty
return { ...def, enabled: true, config: {} };

// GOOD — no polyfill needed
return Object.assign({}, def, { enabled: true, config: {} });
```

```typescript
// BAD — esbuild may generate defineProperty polyfill for class fields
class MyHelper {
  count = 0;            // class field declaration
  items: string[] = []; // class field declaration
}

// GOOD — initialize in constructor or use plain objects
function createHelper() {
  return { count: 0, items: [] };
}
```

**General rule:** In SUI `.ts` files, avoid any syntax that causes esbuild to emit `Object.defineProperty`, `Object.defineProperties`, or `Object.getOwnPropertyDescriptors` helpers. Specifically:

| Avoid | Use Instead |
|-------|-------------|
| `{ ...obj }` object spread | `Object.assign({}, obj)` |
| `{ ...a, ...b }` merge | `Object.assign({}, a, b)` |
| `class { field = value }` | Constructor init or plain objects |
| Decorators | Avoid in SUI scripts |

### No ES Module Exports

SUI scripts are **not** ES modules. Do not use `export` or `import` for browser-side code.

```typescript
// BAD
export function handleClick() { ... }
import { helper } from "./utils";

// GOOD — everything is in global/closure scope
function handleClick() { ... }
```

The only exception: `import { $Backend, Component, EventData } from "@yao/sui"` is a type-only import that gets stripped during compilation.

### Backend Script — No `export`, Plain Functions

```typescript
// BAD
export function GetIntegrations() { ... }

// GOOD — Api prefix, no export
function ApiGetIntegrations(request: Request) { ... }
```

### Component Single Root Element

Components must have exactly **one** root element:

```html
<!-- BAD -->
<nav>...</nav>
<footer>...</footer>

<!-- GOOD -->
<div>
  <nav>...</nav>
  <footer>...</footer>
</div>
```

### `$param` Only in Templates

```html
<!-- In template: OK -->
<h1>{{ $param.id }}</h1>
```

```typescript
// In backend script: use request.params
function ApiGetEntry(request: Request) {
  const id = request.params.id;  // NOT $param.id
}
```

### `$Backend().Call()` Route Derivation

`$Backend()` derives the API route from `document.body.getAttribute("s:public")` combined with `window.location.pathname`. In Agent SUI, the route is typically `/agents/{assistant_id}/{page_name}`. Be aware of this when debugging backend call failures — the route must match the server-side page registration.

### Frontend Async Initialization

SUI's `__sui_event_init` runs synchronously after all scripts load. If your page script needs async initialization (e.g., fetching data from backend), use a pattern like:

```typescript
// At the bottom of your page .ts file
async function init() {
  const data = await $Backend().Call("GetData");
  renderUI(data);
}

// Kick off async init
init().catch((e) => console.error("Init failed:", e));
```

### Cache During Development

SUI caches compiled pages. When modifying `.ts` / `.html` / `.css` during development, always use `?__debug` to see changes immediately:

```
http://localhost:5099/agents/yao.keeper/settings?__debug
```

Without `__debug`, you may see stale compiled output even after editing source files.

---

## 12. Quick Reference

### Frontend API Cheat Sheet

```typescript
const self = this as Component;

// DOM queries
self.find(".my-class");                    // __Query wrapper
self.query(".my-class");                   // native querySelector
self.queryAll(".my-class");                // native querySelectorAll
self.$root.find(".child").elm();           // get raw element

// Props
self.props.Get("key");                     // string prop
self.props.List();                         // all props

// Store (element data)
self.store.Set("key", "value");
self.store.Get("key");
self.store.SetJSON("key", { a: 1 });
self.store.GetJSON("key");
self.store.GetData();                      // BeforeRender data

// State
self.state.Set("key", value);              // triggers watch + propagation

// Events
self.emit("custom-event", { payload });    // dispatch CustomEvent on root

// Render
self.render(template, data, target);       // partial render

// Backend
const result = await $Backend().Call("MethodName", arg1, arg2);

// OpenAPI
const api = new OpenAPI({ baseURL: "/v1" });
const resp = await api.Get("/endpoint");
const resp = await api.Post("/endpoint", body);
```

### Backend API Cheat Sheet

```typescript
import { Process, Exception, FS, Store, http } from "@yao/runtime";

// Called by frontend as $Backend().Call("GetData")
function ApiGetData(request: Request): any {
  return Process("models.my.model.Get", {});
}

// Called before page render
function BeforeRender(request: Request, props: any): any {
  return { title: "My Page" };
}
```

---

## 13. Debugging

### CDP (Chrome DevTools Protocol)

For debugging SUI pages in development:

1. Launch Chrome with remote debugging:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --user-data-dir=/tmp/chrome-debug \
     "http://localhost:5099/agents/yao.keeper/settings?__debug"
   ```

2. Connect via puppeteer-core or Chrome DevTools at `chrome://inspect`

3. Capture console errors programmatically:
   ```typescript
   import puppeteer from "puppeteer-core";
   const browser = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222" });
   const page = (await browser.pages())[0];
   page.on("pageerror", (err) => console.error(err.message, err.stack));
   page.on("console", (msg) => console.log(`[${msg.type()}]`, msg.text()));
   ```

### Common Error Patterns

| Error | Likely Cause |
|-------|-------------|
| `Property description must be an object` | esbuild polyfill global variable collision (see Section 11) |
| `window[cn] is not a function` | Component `s:cn` doesn't match any registered function |
| `$Backend is not defined` | `libsui.min.js` failed to load |
| `Cannot read properties of null` in `__sui_store` | Element passed to store doesn't exist in DOM |
