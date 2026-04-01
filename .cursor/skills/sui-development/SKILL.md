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

## How It Works (Build Pipeline)

SUI i18n is **server-side rendered**. The build process:

1. Scans HTML for `s:trans` elements and `'::text'` / `__m("text")` markers
2. Extracts text, assigns auto-generated keys like `trans_<route>_1`, `trans_<route>_2`, ...
   (route slashes become underscores: route `features/hero` → key prefix `trans_features_hero`)
3. For each key, looks up translations via two mechanisms (in order):
   a. **`keys:`** — direct mapping `trans_<route>_N: translated text` (primary, used at runtime)
   b. **`messages:`** — original text → translated text lookup (used during build to populate `keys:`)
4. Writes compiled locale files to `public/.locales/<locale>/<route>.yml` with resolved `keys:` map
   (the `messages:` block is **stripped** from compiled output — only `keys:` survives)
5. At request time, reads the `locale` cookie, loads the compiled locale, and replaces text

**The `locale` cookie must use lowercase values: `zh-cn`, `en-us`, `ja`, etc.**

## Translation Markers

Three ways to mark translatable content:

```html
<!-- 1. s:trans attribute (most common) — wraps the element's text content -->
<span s:trans>Hello World</span>
<p s:trans>This entire paragraph will be translated.</p>
<button s:trans>Submit</button>

<!-- 2. Inline translation in template expressions -->
<span>{{ '::Welcome' }}</span>

<!-- 3. In frontend scripts — use __m() or T() -->
```

```typescript
const message = __m("Welcome back");
const label = T("Settings");
```

> **Important**: `T()` and `__m()` can only be called **inside functions**, not at module top-level.
> The SUI translation runtime is not initialized when top-level constants are evaluated.
>
> **Wrong** — `T()` at top level:
>
> ```typescript
> const LABEL = T("Hello"); // ✗ — T() not available yet, returns undefined or throws
> ```
>
> **Correct** — `T()` inside a function:
>
> ```typescript
> const LABEL_KEY = "Hello";
> function init() {
>   const label = T(LABEL_KEY); // ✓ — called at runtime
> }
> ```

> **Important**: `s:trans` captures the **trimmed text content** of the element as the lookup key.
> The key in `messages:` must match **exactly** (case-sensitive, whitespace-trimmed).

## Locale File Structure

Locale files live under the template root `__locales/` directory, organized by locale:

```
__locales/
├── en-us/
│   ├── __global.yml        # Shared translations (header, footer, etc.)
│   ├── index.yml           # Page-specific: /index
│   ├── features.yml        # Page-specific: /features (parent page itself)
│   ├── features/           # Sub-component locale files
│   │   ├── hero.yml        # For component at /features/hero
│   │   ├── agents.yml      # For component at /features/agents
│   │   └── cta.yml         # For component at /features/cta
│   └── styleguide.yml      # Page-specific: /styleguide
├── zh-cn/
│   ├── __global.yml
│   ├── index.yml
│   ├── features.yml
│   ├── features/
│   │   ├── hero.yml
│   │   ├── agents.yml
│   │   └── cta.yml
│   └── styleguide.yml
├── zh-tw/
│   └── ...
└── ja/
    └── ...
```

**CRITICAL rules:**

- Directory names MUST be **lowercase**: `zh-cn`, `en-us`, `ja` (not `zh-CN`)
- Page locale file name = page route: route `/styleguide` → `styleguide.yml`
- `__global.yml` is merged into every page's locale at build time
- **Sub-component translations MUST go in route-matching files** (see next section)
- Do NOT put locale files inside component source directories (e.g. ~~`features/hero/__locales/`~~)

## Sub-Component Locale Files (CRITICAL)

When a page includes sub-components via `is="/features/hero"`, each sub-component gets its
own translation key prefix based on its route. The build process uses **prefix filtering** to
match keys to locale files:

- Parent page `/features` → key prefix `trans_features_` → reads `__locales/<lang>/features.yml`
- Sub-component `/features/hero` → key prefix `trans_features_hero_` → reads `__locales/<lang>/features/hero.yml`
- Sub-component `/features/agents` → key prefix `trans_features_agents_` → reads `__locales/<lang>/features/agents.yml`

**The parent page's `MergeTranslations` only processes keys matching its own prefix.**
Sub-component keys (e.g. `trans_features_hero_*`) do NOT match the parent prefix (`trans_features_*`),
so they are resolved from their own locale files via `Merge(compLocale)`.

**Wrong** — putting all translations in the parent file only:

```
__locales/zh-cn/
└── features.yml          # Has messages for hero, agents, etc.
                          # ✗ — sub-component keys won't be resolved!
```

**Correct** — one locale file per route (parent + each sub-component):

```
__locales/zh-cn/
├── features.yml          # Translations for features.html itself (if any)
└── features/
    ├── hero.yml          # Translations for features/hero component
    ├── agents.yml        # Translations for features/agents component
    ├── technical.yml     # Translations for features/technical component
    └── cta.yml           # Translations for features/cta component
```

Each sub-component file needs both `keys:` and `messages:`:

```yaml
# __locales/zh-cn/features/hero.yml
keys:
    trans__features_hero_1: AI 团队
    trans__features_hero_2: 一应俱全
messages:
  "Your AI Team": "AI 团队"
  "Ready for Action": "一应俱全"
```

### Managing `keys:` (CRITICAL — Learned the Hard Way)

**NEVER clear `keys:` to `{}` and expect `yao sui trans` to regenerate them.**
`yao sui trans` only updates *existing* keys — it does NOT create new keys from scratch.

The `keys:` are generated during `yao sui build`, which scans HTML `s:trans` tags, assigns
sequential numbers, and resolves translations from `messages:`. The result is written to
**compiled output** at `public/.locales/<lang>/<route>.yml`, NOT back to source files.

**When you add new `s:trans` content to an existing component:**

1. Ensure the new text has corresponding `messages:` entries in the locale file
2. Run `yao sui build` — it generates compiled locale with the new keys
3. Check compiled output: `cat public/.locales/<lang>/<route>/component.yml`
4. Copy the new `keys:` block from compiled output back into the source locale file
5. Run `yao sui build` again to finalize

**If you accidentally cleared `keys: {}`:**

1. Run `yao sui build` — the compiled output still generates correct keys from `messages:`
2. Extract keys from compiled output:
   ```bash
   cat public/.locales/zh-cn/features/hero.yml | grep "trans__features_hero_"
   ```
3. Paste the keys block back into `__locales/zh-cn/features/hero.yml`
4. Rebuild

**Why this matters**: At render time, SUI runtime uses `keys:` from the **source locale files**
(merged during build). If source `keys:` is empty, the compiled output gets empty keys too
(for that locale), and translations silently fall back to English.

### How `keys:` and `messages:` Work Together (Source Code Reference)

The build pipeline (`sui/core/locale.go`) resolves translations in this order:

1. **`MergeTranslations`**: For each extracted `s:trans` text, finds the matching `messages:` entry
   and writes the translated value into `keys:` (e.g. `trans_features_hero_1: 翻译值`)
2. **`ParseKeys`**: If a `keys:` value points to another `messages:` key (indirect reference),
   resolves it to the final translated text
3. **`Merge(compLocale)`**: Merges sub-component locale data (their `keys:`) into the parent page locale

At **render time** (`sui/core/parser.go`), the `transNode` function checks:
1. First: `keys[key]` — if found and differs from source text, use it
2. Then: `messages[sourceText]` — fallback lookup
3. Otherwise: return original text unchanged

Since compiled output **strips `messages:`**, runtime effectively relies on `keys:` only.

## Locale File Format

**`__locales/zh-cn/__global.yml`** — shared across all pages:

```yaml
direction: ltr
timezone: "+08:00"
messages:
  Home: 首页
  Features: 特性
  "Get Started": 开始使用
```

**`__locales/zh-cn/styleguide.yml`** — page-specific:

```yaml
messages:
  "Toggle Theme": 切换主题
  "Used for buttons, links, and interactive elements.": 用于按钮、链接等交互元素。
```

**`__locales/en-us/__global.yml`** — default locale (key = value):

```yaml
messages:
  Home: Home
  Features: Features
  "Get Started": Get Started
```

### Format Details

| Field | Purpose | Required |
| ----- | ------- | -------- |
| `messages:` | Map of original text → translated text. Key = exact text from `s:trans` element | Yes |
| `direction:` | Text direction: `ltr` or `rtl` | No |
| `timezone:` | Timezone offset string | No |
| `keys:` | Auto-generated by `yao sui trans` — maps `trans_<route>_N` to translated text. Do NOT edit manually | No |
| `script_messages:` | Translations for `__m()` / `T()` calls in `.ts` scripts | No |

> **`messages:` key matching**: The key must be the exact trimmed text content from the HTML.
> For `<span s:trans>Hello World</span>`, the key is `Hello World`.

### Mixed HTML Content — Use Separate Elements

`s:trans` captures the **full innerHTML** of the element. If an element contains child HTML tags
(like `<strong>`, `<a>`, `<code>`), the entire innerHTML becomes the key, which is fragile and
often fails to match. **Always split mixed content into separate translatable elements.**

**Wrong** — `s:trans` on a parent that contains child tags:

```html
<li s:trans><strong>Primary</strong> — Main page action (CTA)</li>
<!-- key becomes: "<strong>Primary</strong> — Main page action (CTA)" -->
<!-- This will NOT match in the locale file -->

<p s:trans>Click <a href="#">here</a> to continue.</p>
<!-- key becomes: "Click <a href=\"#\">here</a> to continue." — won't match -->
```

**Correct** — put `s:trans` only on leaf elements containing pure text:

```html
<li><strong>Primary</strong> — <span s:trans>Main page action (CTA)</span></li>
<!-- key: "Main page action (CTA)" ✓ -->

<p><span s:trans>Click</span> <a href="#" s:trans>here</a> <span s:trans>to continue.</span></p>
<!-- keys: "Click", "here", "to continue." ✓ -->
```

**Rule of thumb**: if an element contains any child HTML tags, do NOT put `s:trans` on it.
Instead, wrap each translatable text segment in its own `<span s:trans>` or put `s:trans`
on the child element directly. Non-translatable content (variable names, CSS class names,
code tokens) stays outside `s:trans` elements.

### YAML Value Quoting

YAML values that contain colons (`:`) MUST be quoted, otherwise the YAML parser treats
the colon as a nested mapping delimiter and the entire file fails to parse.

**Wrong**:

```yaml
messages:
  "Header bar, floating panels.": 顶栏。配合 backdrop-filter: blur 使用。
  # ← YAML parser error: "mapping values are not allowed here"
```

**Correct**:

```yaml
messages:
  "Header bar, floating panels.": "顶栏。配合 backdrop-filter: blur 使用。"
  # ← value is quoted, colon inside is safe
```

**Always quote values that contain**: `:`, `#`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `?`, `|`, `-`, `<`, `>`, `=`, `!`, `%`, `@`, `` ` ``.

## Build Commands

```bash
yao sui trans <sui> <template>              # Extract strings, generate/update locale scaffolds, then build
yao sui trans <sui> <template> -l zh-cn,ja  # Only specific locales
yao sui build <sui> <template>              # Build only (compiles translations into public/)
```

`yao sui trans` scans all pages, extracts `s:trans` / `__m()` text, merges with existing
`messages:` in locale files, generates `keys:` mappings, and then triggers a full build.
After adding new locale files, **always run `yao sui trans` first** (not just `build`)
to ensure `keys:` are properly generated from `messages:`.

## Workflow: Adding i18n to a New Page

1. Add `s:trans` attributes to all translatable text in HTML
2. Create locale files matching the page route structure:
   - `__locales/<lang>/<page>.yml` for the page itself
   - `__locales/<lang>/<page>/<component>.yml` for each sub-component
3. Fill in `messages:` with `"English text": "翻译"` pairs (set `keys: {}` initially)
4. Run `yao sui build <sui> <template>` to compile — this generates correct `keys:` in compiled output
5. Extract keys from compiled output and write them back to source locale files:
   ```bash
   cat public/.locales/zh-cn/<page>/<component>.yml | grep "trans__"
   ```
6. Paste the `keys:` block into `__locales/zh-cn/<page>/<component>.yml` (replacing `keys: {}`)
7. Run `yao sui build` again to finalize
8. Verify: switch language in browser, confirm all text is translated

## Workflow: Adding New Translatable Content to an Existing Page

1. Add new `s:trans` elements in the component HTML
2. Add corresponding `messages:` entries to the locale files (all languages)
3. Run `yao sui build` — compiled output will contain new keys (e.g. `trans__features_hero_21` onwards)
4. Extract the **full** keys block from compiled output and replace source `keys:` with it
5. Rebuild — translations will now work correctly

**Do NOT** clear `keys:` to `{}` expecting `yao sui trans` to regenerate.
**Do NOT** rely on `yao sui trans` alone to add new keys — it only updates existing ones.

## Dynamic `<html lang>`

Use the built-in `$locale` variable to set the document language dynamically:

```html
<html lang="{{ $locale }}">
```

## Client-Side Locale Switching

Set the `locale` cookie (lowercase!) and reload:

```javascript
document.cookie = "locale=zh-cn;path=/;max-age=31536000";
window.location.reload();
```

SUI reads the `locale` cookie on each request to determine which compiled locale file to use.

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
