# Office Documents (`gou/office`)

> **Process group:** `office` — registered in `gou/office/process.go`

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `office.Parse` | `filePath`, `config?` | `ProcessParseResult` | Parse DOCX/PPTX from file → Markdown + metadata + media |
| `office.ParseBytes` | `data` (base64), `config?` | `ProcessParseResult` | Parse from base64 data (in-memory files) |

**Config:** `{ output_dir?: string }` — directory for writing embedded media (falls back to OS temp directory if not provided).

**ProcessParseResult:**

```typescript
{
  markdown: string;
  metadata: { title, author, subject, keywords: string; pages: number; };
  media: [{ id, type, format, filename, path: string }];
}
```

**Note:** `media[].path` is an OS absolute path (file is written to `output_dir`). There is no longer a base64 `content` field. TS scripts must pass `output_dir` (obtain OS path via `fs.data.Abs`); otherwise the fallback path in OS temp cannot be accessed via the `data` space.

**Supported formats:** `.docx`, `.pptx`

**Keeper usage:** Document import (DOCX → Markdown), Slide Parsing (PPTX → Markdown + slide images). `media[].path` used by TS to `attachment.Save` if persistence needed.
