# Sitemap (`yao/sitemap`)

> **Process group:** `sitemap`
>
> Full sitemaps.org protocol support: parsing, validation, robots.txt extraction, recursive
> discovery, paginated fetching, and streaming generation with auto-splitting.
> Includes Google Image, Video, and News sitemap extensions.

---

## Processes

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `sitemap.Parse` | `xmlString` | `ParseResult` | Parse urlset or sitemapindex XML |
| `sitemap.Validate` | `xmlString` | `true` \| `string` | Validate sitemap XML |
| `sitemap.ParseRobo` | `robotsTxt` | `string[]` | Extract sitemap URLs from robots.txt |
| `sitemap.Discover` | `domain`, `options?` | `DiscoverResult` | Discover all sitemaps for a domain |
| `sitemap.Fetch` | `domain`, `options?` | `FetchResult` | Fetch URLs with pagination |
| `sitemap.Build.Open` | `options` | `string` (handle) | Open streaming sitemap writer |
| `sitemap.Build.Write` | `handle`, `urls` | — | Write URL batch |
| `sitemap.Build.Close` | `handle` | `BuildResult` | Finalize and close writer |

---

## sitemap.Parse

Parse a sitemap XML string. Auto-detects `<urlset>` or `<sitemapindex>` format.
Supports Google Image, Video, and News extensions.

```typescript
var result = Process("sitemap.Parse", xmlString);
// result.type     → "urlset" or "sitemapindex"
// result.urls     → [{loc: "https://example.com/page1", lastmod: "2025-01-01", images: [...]}]
// result.sitemaps → [{loc: "https://example.com/sitemap1.xml", lastmod: "..."}]
```

### ParseResult

| Field      | Type             | Description |
|------------|------------------|-------------|
| `type`     | string           | `"urlset"` or `"sitemapindex"` |
| `urls`     | URL[]            | Populated when type = `"urlset"` |
| `sitemaps` | SitemapEntry[]   | Populated when type = `"sitemapindex"` |

---

## sitemap.Validate

Check whether a string is valid sitemap XML.
Returns `true` on success, or an error description string.

```typescript
var result = Process("sitemap.Validate", xmlString);
if (result !== true) {
  console.log("Invalid sitemap: " + result);
}
```

---

## sitemap.ParseRobo

Extract sitemap URLs from `robots.txt` content. Pure text parsing, no HTTP.
Handles case-insensitive `Sitemap:` directives and deduplicates.

```typescript
var urls = Process("sitemap.ParseRobo", robotsTxtContent);
// urls → ["https://example.com/sitemap.xml", "https://example.com/sitemap2.xml"]
```

---

## sitemap.Discover

Discover all sitemap files for a domain. Performs HTTP requests to:
1. `https://{domain}/robots.txt` — extract `Sitemap:` directives
2. `https://{domain}/sitemap.xml` — well-known fallback
3. Recursively expand `sitemapindex` files (up to depth 3)

Optimized for bandwidth: uses streaming detection and HEAD requests for metadata.

```typescript
var result = Process("sitemap.Discover", "example.com");
// result.sitemaps   → [{url: "...", source: "robots.txt", url_count: 500, ...}]
// result.total_urls → 5000

// With options
var result = Process("sitemap.Discover", "example.com", {
  user_agent: "MyBot/1.0",
  timeout: 60,
});
```

### DiscoverOptions

| Field        | Type   | Default            | Description |
|--------------|--------|--------------------|-------------|
| `user_agent` | string | `"Yao-Robot/1.0"`  | Custom User-Agent header |
| `timeout`    | number | `30`               | Per-request timeout in seconds |

### DiscoverResult

| Field       | Type           | Description |
|-------------|----------------|-------------|
| `sitemaps`  | SitemapLink[]  | Discovered sitemap files |
| `total_urls`| number         | Estimated total URLs across all sitemaps |

### SitemapLink

| Field          | Type   | Description |
|----------------|--------|-------------|
| `url`          | string | Sitemap URL |
| `source`       | string | `"robots.txt"`, `"well-known"`, or `"index"` |
| `url_count`    | number | Estimated URL count |
| `content_size` | number | Content-Length in bytes (0 if unknown) |
| `encoding`     | string | `"gzip"`, `"br"`, or `""` |
| `last_modified`| string | Last-Modified header |
| `etag`         | string | ETag header |

---

## sitemap.Fetch

Fetch and parse URLs from all sitemaps for a domain. Uses `Discover` internally.
Supports **pagination** via `offset` / `limit` for handling sites with millions of URLs.

Stream-parses XML — does not load entire files into memory.

```typescript
// Fetch first 100 URLs
var page1 = Process("sitemap.Fetch", "example.com", { limit: 100 });
// page1.urls  → [{loc: "https://example.com/page1", lastmod: "...", ...}, ...]
// page1.total → 50000

// Fetch next page
var page2 = Process("sitemap.Fetch", "example.com", { offset: 100, limit: 100 });
```

### FetchOptions

| Field        | Type   | Default            | Description |
|--------------|--------|--------------------|-------------|
| `offset`     | number | `0`                | Skip first N URLs |
| `limit`      | number | `50000`            | Max URLs to return |
| `user_agent` | string | `"Yao-Robot/1.0"`  | Custom User-Agent |
| `timeout`    | number | `30`               | Per-request timeout in seconds |

### FetchResult

| Field   | Type  | Description |
|---------|-------|-------------|
| `urls`  | URL[] | Parsed URL entries |
| `total` | number| Total URL count across all sitemaps (estimated for un-fetched files) |

---

## sitemap.Build (Open / Write / Close)

Streaming sitemap generation with automatic file splitting at 50,000 URLs per file
and sitemap index generation when multiple files are created.

Uses a UUID-based handle pattern (same as `excel.open` / `excel.close`).

### Step 1: Open

```typescript
var handle = Process("sitemap.Build.Open", {
  dir: "/data/sitemaps",
  base_url: "https://example.com",
});
```

**BuildOptions:**

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| `dir`      | string | yes      | Output directory (absolute path) |
| `base_url` | string | yes*     | Base URL for index references (*required if > 50K URLs) |

### Step 2: Write (repeatable)

```typescript
Process("sitemap.Build.Write", handle, [
  { loc: "https://example.com/page1", lastmod: "2025-01-01", priority: "0.8" },
  { loc: "https://example.com/page2", changefreq: "daily" },
  {
    loc: "https://example.com/page3",
    images: [{ loc: "https://example.com/img1.jpg", caption: "Photo" }],
  },
]);
```

Write can be called multiple times. The writer automatically:
- Creates a new file when the current file reaches 50,000 URLs
- Handles XML namespace declarations for Image/Video/News extensions

### Step 3: Close

```typescript
var result = Process("sitemap.Build.Close", handle);
// result.index → "/data/sitemaps/sitemap_index.xml" (empty if single file)
// result.files → ["/data/sitemaps/sitemap_1.xml", "/data/sitemaps/sitemap_2.xml"]
// result.total → 75000
```

**BuildResult:**

| Field   | Type     | Description |
|---------|----------|-------------|
| `index` | string   | Path to sitemap index file (empty string if ≤ 50K URLs) |
| `files` | string[] | Paths to all generated sitemap files |
| `total` | number   | Total URLs written |

---

## Data Types

### URL

| Field        | Type    | Description |
|--------------|---------|-------------|
| `loc`        | string  | Page URL (required) |
| `lastmod`    | string? | Last modification date |
| `changefreq` | string? | `"always"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`, `"never"` |
| `priority`   | string? | Priority `"0.0"` to `"1.0"` |
| `images`     | Image[]?| Google Image extension entries |
| `videos`     | Video[]?| Google Video extension entries |
| `news`       | News?   | Google News extension entry |

### Image (Google Image Extension)

| Field     | Type   | Description |
|-----------|--------|-------------|
| `loc`     | string | Image URL |
| `caption` | string?| Image caption |
| `title`   | string?| Image title |
| `license` | string?| License URL |

### Video (Google Video Extension)

| Field              | Type   | Description |
|--------------------|--------|-------------|
| `thumbnail_loc`    | string | Thumbnail URL |
| `title`            | string | Video title |
| `description`      | string | Video description |
| `content_loc`      | string?| Direct video URL |
| `player_loc`       | string?| Player embed URL |
| `duration`         | number?| Duration in seconds |
| `publication_date` | string?| Publication date |

### News (Google News Extension)

| Field              | Type        | Description |
|--------------------|-------------|-------------|
| `publication`      | Publication | `{name, language}` |
| `publication_date` | string      | Publication date |
| `title`            | string      | Article title |
| `keywords`         | string?     | Comma-separated keywords |

### SitemapEntry

| Field     | Type   | Description |
|-----------|--------|-------------|
| `loc`     | string | Child sitemap URL |
| `lastmod` | string?| Last modification date |

---

## Constants

| Constant           | Value   | Description |
|--------------------|---------|-------------|
| `MaxURLsPerFile`   | 50,000  | Max URLs per sitemap file (sitemaps.org spec) |
| `DefaultUserAgent` | `"Yao-Robot/1.0"` | Default User-Agent for HTTP requests |
| `DefaultTimeout`   | 30      | Default per-request timeout (seconds) |
| `MaxDiscoverDepth` | 3       | Maximum sitemapindex recursion depth |

---

## Keeper Usage

- **Site crawling** — `sitemap.Discover` → `sitemap.Fetch` (paginated) → process URLs → `models.*.entry.Create`
- **Incremental crawl** — Compare `lastmod` from sitemap URLs against stored entries
- **SEO output** — `sitemap.Build.Open/Write/Close` to generate sitemaps from Keeper entries
- **robots.txt analysis** — `sitemap.ParseRobo` to extract sitemap references without full discovery
