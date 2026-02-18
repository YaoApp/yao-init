# HTTP Client (`gou/http`)

> **Process group:** `http`

General-purpose HTTP client for fetching web pages, calling REST APIs, downloading files.

| Process | Args | Description |
|---------|------|-------------|
| `http.Get` | `url`, `query?`, `headers?` | HTTP GET |
| `http.Post` | `url`, `payload?`, `files?`, `query?`, `headers?` | HTTP POST (supports multipart file upload) |
| `http.Put` | `url`, `payload?`, `query?`, `headers?` | HTTP PUT |
| `http.Patch` | `url`, `payload?`, `query?`, `headers?` | HTTP PATCH |
| `http.Delete` | `url`, `payload?`, `query?`, `headers?` | HTTP DELETE |
| `http.Head` | `url`, `payload?`, `query?`, `headers?` | HTTP HEAD |
| `http.Send` | `method`, `url`, `payload?`, `query?`, `headers?`, `files?` | Arbitrary method |
| `http.Stream` | `method`, `url`, `handler`, `payload?`, `query?`, `headers?` | Streaming response with callback |

**Response format:**

```typescript
{
  status: number;    // HTTP status code (200, 404, etc.)
  code: number;      // Same as status
  data: any;         // Response body (auto-parsed JSON, or raw bytes)
  headers: Record<string, string[]>;
  message: string;   // Error message if present
}
```

**Key points:**
- JSON responses are automatically parsed into objects
- Non-JSON responses: `data` is Go `[]byte`; when passed to JS it is automatically encoded as a **base64 string** (not `Uint8Array`). Use `fs.WriteFileBase64(path, data)` when writing files
- Proxy via environment variables (`HTTP_PROXY`, `HTTPS_PROXY`)
- Timeout via context (set in Go code, not directly in Process args)
- Supports file upload via multipart form data

**Runtime API (recommended):**

```typescript
import { http } from "@yao/runtime";

const resp = http.Get(url);              // Returns HttpResponse with type inference
const resp = http.Post(url, payload);
const resp = http.Send("PUT", url, data);
```

> Prefer the `http.*` Runtime API over `Process("http.Get", ...)`. Type-safe and more concise.

**Keeper usage:** Fetch web pages (Built-in Fetch), call Bright Data API, call Jina Reader API, validate tokens against third-party APIs.
