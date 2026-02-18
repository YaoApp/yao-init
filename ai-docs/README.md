# Keeper — Platform Infrastructure Reference

> Catalog of Yao platform capabilities that Keeper can use directly via `Process()` calls.
> These are building blocks — no external APIs needed, already implemented in the Yao runtime.

Each section has its own detailed document. This page provides a summary with links.

---

## Modules

| # | Module | Process Group | Summary | Doc |
|---|--------|---------------|---------|-----|
| 1 | [HTTP Client](./http.md) | `http` | General-purpose HTTP client — GET/POST/PUT/PATCH/DELETE, streaming, file upload | [http.md](./http.md) |
| 2 | [Text Processing](./text.md) | `text` | HTML ↔ Markdown conversion, LLM output extraction | [text.md](./text.md) |
| 3 | [Attachment Storage](./attachment.md) | `attachment` | File storage with metadata, permissions, local/S3 backends | [attachment.md](./attachment.md) |
| 4 | [Excel](./excel.md) | `excel` | Full Excel (.xlsx) read/write with streaming iterators | [excel.md](./excel.md) |
| 5 | [PDF](./pdf.md) | `pdf` | PDF info, split, convert to images | [pdf.md](./pdf.md) |
| 6 | [Office Documents](./office.md) | `office` | DOCX/PPTX → Markdown + embedded media | [office.md](./office.md) |
| 7 | [FFmpeg](./ffmpeg.md) | `ffmpeg` | Media info, format conversion, audio extraction, chunking | [ffmpeg.md](./ffmpeg.md) |
| 8 | [File System](./fs.md) | `fs` | Abstracted file I/O with multiple spaces (dsl, data, system) | [fs.md](./fs.md) |
| 9 | [Cache / Store](./store.md) | `Store` | Key-value storage — LRU (in-memory) and Xun (DB-backed) | [store.md](./store.md) |
| 10 | [Concurrent Execution](./concurrent.md) | `All` / `Any` / `Race` | Synchronous concurrent Process execution via Go goroutines | [concurrent.md](./concurrent.md) |
| 11 | [Job Queue](./job.md) | `job` | Async job execution with worker pool, cron, progress tracking | [job.md](./job.md) |
| 12 | [Model CRUD](./model.md) | `models.*` | Standard data model operations (Get, Find, Create, Update, Delete) | [model.md](./model.md) |
| 13 | [Exception](./exception.md) | `Exception` | Unified error handling with HTTP status code mapping | [exception.md](./exception.md) |
| 14 | [RSS / Atom](./rss.md) | `rss` | Feed parsing, validation, building, discovery, fetching with conditional requests | [rss.md](./rss.md) |
| 15 | [Sitemap](./sitemap.md) | `sitemap` | Sitemap parsing, validation, discovery, paginated fetch, streaming build | [sitemap.md](./sitemap.md) |
| 16 | [SUI Framework](./sui.md) | — | Frontend framework — pages, components, data binding, backend scripts, OpenAPI | [sui.md](./sui.md) |
| 17 | [Agent Architecture](./agent.md) | — | Connector resolution, capabilities, uses system, A2A calls | [agent.md](./agent.md) |
| 18 | [Authorization](./authorized.md) | — | Team/user context, `Authorized()`, `ctx.authorized` | [authorized.md](./authorized.md) |
| 19 | [Agent Testing](./testing.md) | `agent test` | Script tests, E2E tests, assertion API, CLI reference | [testing.md](./testing.md) |

---

## Quick Reference: What to Use for Each Capability

| Keeper Capability | Platform Infrastructure Used |
|-------------------|------------------------------|
| **Web Fetch (Built-in)** | `http.Get` → `text.HTMLToMarkdown` → `models.*.entry.Create` |
| **Web Fetch (Bright Data)** | `http.Post` (Bright Data API) → `text.HTMLToMarkdown` → `models.*.entry.Create` |
| **RSS / Atom Parsing** | `rss.Fetch` → parsed Feed → `models.*.entry.Create` |
| **RSS Discovery** | `rss.Discover` (text analysis, no HTTP) |
| **RSS Feed Generation** | `rss.Build` (Feed object → XML string) |
| **Sitemap Discovery** | `sitemap.Discover` (robots.txt + well-known paths, recursive index expansion) |
| **Sitemap Crawling** | `sitemap.Fetch` (paginated URL extraction with offset/limit) |
| **Sitemap Generation** | `sitemap.Build.Open` → `.Write` → `.Close` (streaming, auto-split at 50K URLs) |
| **Notion** | `http.Get/Post` (Notion API) → blocks → Markdown → `models.*.entry.Create` |
| **GitHub** | `http.Get` (GitHub API) → Markdown → `models.*.entry.Create` |
| **PDF Extraction** | `pdf.Convert` → page images → OCR/LLM vision → Markdown |
| **Slide Parsing** | `office.Parse` (.pptx) → Markdown + media paths → optional `attachment.Save` |
| **Doc Import** | `office.Parse` (.docx) → Markdown + media paths → optional `attachment.Save` |
| **Spreadsheet Parsing** | `excel.open` + `excel.read.row` → Markdown table |
| **Video Parsing** | `ffmpeg.ExtractAudio` → `ffmpeg.ChunkAudio` → STT → Markdown |
| **Audio Transcription** | `ffmpeg.ChunkAudio` → chunk paths → AI connector (STT) → Markdown |
| **LLM JSON Extraction** | `text.ExtractJSON` → parsed object (handles code blocks, YAML, embedded JSON) |
| **Image Recognition** | AI connector (vision/OCR) → text |
| **File Storage** | `attachment.Save` / `attachment.Read` / `attachment.URL` |
| **Temp File I/O** | `fs.data.MkdirTemp` / `fs.data.WriteFileBuffer` / `fs.data.RemoveAll` |
| **All Entry CRUD** | `models.agents.yao.keeper.entry.*` |
| **Config Cache** | `new Store("__yao.cache")` → `GetSet(key, loader, ttl)` |
| **Persistent KV** | `new Store("__yao.store")` → DB-backed with LRU cache layer |
| **Batch URL Fetch** | `All([{process, args}, ...])` → concurrent execution |
| **A2A Call (Hook)** | `ctx.agent.Call("assistant.id", { messages, options })` → `Result` |
| **A2A Call (Process)** | `Process("agent.Call", { assistant_id, messages, timeout?, ... })` → `Result` |
| **Scheduled Sync** | `job.Cron` + `job.Push` → periodic background execution |
| **SUI Pages** | `.html` + `.ts` + `.css` → compiled pages at `/agents/{id}/{page}` |
| **SUI Backend Scripts** | `.backend.ts` → `Api*` functions callable via `$Backend().Call()` |
| **Script Tests** | `yao-dev agent test -n yao.keeper -i scripts.yao.keeper.store --ctx tests/ctx.json -v` |
| **Agent E2E Tests** | `yao-dev agent test -n yao.keeper -i tests/cases.jsonl -v` |

---

## See Also

- **[src/docs/](../src/docs/)** — Process handler documentation per module
- **[mcps/docs/](../mcps/docs/)** — MCP tool documentation per integration
