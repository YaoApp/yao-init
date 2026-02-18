# Exception Handling

> **Import:** `import { Exception } from "@yao/runtime"`

Yao's unified exception class, replacing `throw new Error(...)`. When thrown, the Yao framework handles it specially based on `code` (e.g. API response status code, error log level).

```typescript
// Constructor
new Exception(message: string, code: number)

// Examples
throw new Exception("fetch.URL: url is required", 400);      // Parameter error
throw new Exception(`fetch.URL: HTTP ${status} for ${url}`, status); // Upstream HTTP error, pass through status code
throw new Exception("AI connector failed", 500);              // Internal error
```

**Common error codes:**

| code | Semantic | Use case |
|------|----------|----------|
| `400` | Bad Request | Missing parameter, unsupported format, column does not exist |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | AI connector failure, internal logic error |
| HTTP status | Pass through upstream | When `http.Get` returns non-2xx, pass through `resp.status` directly |

**Difference from `Error`:**
- `throw new Error(msg)` — Ordinary JS error; Yao treats it as `500` uniformly, cannot distinguish error type
- `throw new Exception(msg, code)` — Yao framework recognizes `code`; API layer maps to HTTP response code automatically; error code is recorded in logs

> **Standard: All errors in TS scripts must use `Exception`; `throw new Error` is prohibited.**
