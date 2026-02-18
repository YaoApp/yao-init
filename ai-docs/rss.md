# RSS / Atom (`yao/rss`)

> **Process group:** `rss`
>
> Full RSS 2.0 and Atom 1.0 support: parsing, validation, building, feed URL discovery,
> and HTTP fetching with gzip decompression and conditional requests.

---

## Processes

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `rss.Parse` | `xmlString` | `Feed` | Parse RSS/Atom XML into a unified Feed object |
| `rss.Validate` | `xmlString` | `true` \| `string` | Validate feed XML; returns `true` or error message |
| `rss.Discover` | `text` | `FeedLink[]` | Extract feed URLs from HTML/Markdown/plain text (no HTTP) |
| `rss.Build` | `feed`, `format?` | `string` | Generate XML from a Feed object |
| `rss.Fetch` | `url`, `options?` | `FetchResult` | Fetch remote feed with conditional request support |

---

## rss.Parse

Parse an RSS 2.0 or Atom 1.0 XML string into a unified Feed object.
Auto-detects format and extracts Podcast/iTunes metadata if present.

```typescript
var feed = Process("rss.Parse", xmlString);
// feed.format  → "rss2.0" or "atom1.0"
// feed.title   → "My Blog"
// feed.items   → [{title: "Post 1", link: "...", ...}, ...]
// feed.podcast → {author: "...", ...} (null for non-podcast feeds)
```

---

## rss.Validate

Check whether a string is valid RSS 2.0 or Atom 1.0.
Returns `true` (boolean) on success, or an error description string on failure.

```typescript
var result = Process("rss.Validate", xmlString);
if (result !== true) {
  console.log("Invalid feed: " + result);
}
```

---

## rss.Discover

Extract feed URLs from HTML, Markdown, or plain text content.
Uses regex-based detection of `<link>` tags and common feed URL patterns.
**No HTTP requests** — pure text analysis.

```typescript
var links = Process("rss.Discover", htmlString);
// links → [{url: "https://example.com/feed.xml", title: "My Blog", type: "rss"}, ...]
```

### FeedLink

| Field   | Type   | Description |
|---------|--------|-------------|
| `url`   | string | Feed URL |
| `title` | string | Feed title (from `<link>` tag, if available) |
| `type`  | string | `"rss"` or `"atom"` (if determinable) |

---

## rss.Build

Generate an XML feed document from a Feed object. Supports both RSS 2.0 and Atom 1.0 output.

```typescript
// Build RSS 2.0 (default)
var xml = Process("rss.Build", feedObj);

// Build Atom 1.0
var xml = Process("rss.Build", feedObj, "atom");

// Round-trip: parse then rebuild
var feed = Process("rss.Parse", originalXML);
var rebuilt = Process("rss.Build", feed, "rss");
```

---

## rss.Fetch

Fetch a remote RSS/Atom feed by URL. Returns the parsed Feed along with HTTP metadata
for efficient conditional polling.

Supports:
- **Gzip decompression** — explicitly sets `Accept-Encoding: gzip` and handles manual decompression
- **Conditional requests** — `If-None-Match` (ETag) and `If-Modified-Since` headers
- **304 Not Modified** — returns `not_modified: true` with no feed parsing when unchanged

```typescript
// First fetch
var result = Process("rss.Fetch", "https://example.com/feed.xml");
// result.feed.title      → "My Blog"
// result.status_code     → 200
// result.etag            → "abc123"
// result.last_modified   → "Wed, 01 Jan 2025 00:00:00 GMT"

// Subsequent polling (saves bandwidth)
var result2 = Process("rss.Fetch", "https://example.com/feed.xml", {
  etag: result.etag,
  last_modified: result.last_modified,
});
if (result2.not_modified) {
  // Feed unchanged — skip processing
}
```

### FetchOptions

| Field           | Type   | Default          | Description |
|-----------------|--------|------------------|-------------|
| `user_agent`    | string | `"Yao-Robot/1.0"`| Custom User-Agent header |
| `timeout`       | number | `30`             | Per-request timeout in seconds |
| `etag`          | string | —                | ETag from previous fetch (for `If-None-Match`) |
| `last_modified` | string | —                | Last-Modified from previous fetch (for `If-Modified-Since`) |

### FetchResult

| Field           | Type    | Description |
|-----------------|---------|-------------|
| `feed`          | Feed    | Parsed feed object (null on 304) |
| `status_code`   | number  | HTTP status code (200, 304, etc.) |
| `etag`          | string  | ETag response header |
| `last_modified` | string  | Last-Modified response header |
| `not_modified`  | boolean | `true` when server returned 304 |

---

## Data Types

### Feed

| Field       | Type       | Description |
|-------------|------------|-------------|
| `format`    | string     | `"rss2.0"` or `"atom1.0"` |
| `title`     | string     | Feed title |
| `link`      | string     | Website URL |
| `description` | string   | Feed description / subtitle |
| `language`  | string?    | Language code (e.g. `"en"`, `"zh-CN"`) |
| `updated`   | string?    | Last updated timestamp |
| `items`     | FeedItem[] | Feed entries |
| `podcast`   | Podcast?   | iTunes/Podcast metadata (null for non-podcast) |

### FeedItem

| Field        | Type        | Description |
|--------------|-------------|-------------|
| `title`      | string      | Item title |
| `link`       | string      | Item permalink |
| `description`| string?     | Short summary |
| `content`    | string?     | Full content (`content:encoded` for RSS, `content` for Atom) |
| `author`     | string?     | Author name |
| `published`  | string?     | Publication date |
| `updated`    | string?     | Last updated date |
| `guid`       | string?     | Globally unique identifier |
| `categories` | string[]?   | Category tags |
| `enclosures` | Enclosure[]?| Attached media files |
| `episode`    | Episode?    | Podcast episode metadata (null for non-podcast items) |

### Enclosure

| Field    | Type   | Description |
|----------|--------|-------------|
| `url`    | string | Media file URL |
| `type`   | string | MIME type (e.g. `"audio/mpeg"`) |
| `length` | string | File size in bytes |

### Podcast (iTunes channel-level)

| Field      | Type     | Description |
|------------|----------|-------------|
| `author`   | string   | `itunes:author` |
| `summary`  | string   | `itunes:summary` |
| `image`    | string   | Cover art URL |
| `owner`    | object   | `{name, email}` |
| `category` | string[] | iTunes category values |
| `explicit` | boolean  | `itunes:explicit` |
| `type`     | string   | `"episodic"` or `"serial"` |

### Episode (iTunes item-level)

| Field      | Type   | Description |
|------------|--------|-------------|
| `duration` | string | `itunes:duration` (HH:MM:SS or seconds) |
| `season`   | number | `itunes:season` |
| `number`   | number | `itunes:episode` |
| `type`     | string | `"full"`, `"trailer"`, or `"bonus"` |
| `explicit` | boolean| `itunes:explicit` |
| `image`    | string | Episode-specific cover art URL |
| `summary`  | string | `itunes:summary` |

---

## Keeper Usage

- **RSS feed import** — `rss.Fetch` → iterate items → `models.*.entry.Create`
- **Conditional polling** — Save `etag` + `last_modified` per feed, pass on next fetch for 304 optimization
- **Feed discovery** — Fetch website HTML via `http.Get` → `rss.Discover` to find feed URLs
- **Feed generation** — Build RSS/Atom feeds from Keeper entries for publishing
