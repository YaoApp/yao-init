# File System (`gou/fs`)

> **Process group:** `fs`

Abstracted file system operations. Default space is `dsl` (app root), `system` for OS root.

### Process API (`Process("fs.<space>.<Op>", ...)`)

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `fs.<space>.ReadFile` | `path` | `string` | Read file content |
| `fs.<space>.WriteFile` | `path`, `content`, `perm?` | `int` | Write text file |
| `fs.<space>.WriteFileBuffer` | `path`, `data`, `perm?` | `int` | Write binary (base64 data) |
| `fs.<space>.ReadFileBuffer` | `path` | `string` | Read file as base64 |
| `fs.<space>.MkdirAll` | `path`, `perm?` | — | Create directory tree |
| `fs.<space>.MkdirTemp` | `dir?`, `pattern?` | `string` | Create temp directory, return path |
| `fs.<space>.Remove` | `path` | — | Delete file or empty dir |
| `fs.<space>.RemoveAll` | `path` | — | Delete dir recursively |
| `fs.<space>.Exists` | `path` | `bool` | Check existence |
| `fs.<space>.IsDir` | `path` | `bool` | Is directory? |
| `fs.<space>.IsFile` | `path` | `bool` | Is regular file? |
| `fs.<space>.MimeType` | `path` | `string` | Detect MIME type by content |
| `fs.<space>.Size` | `path` | `int` | File size in bytes |
| `fs.<space>.BaseName` | `path` | `string` | Filename with extension |
| `fs.<space>.ExtName` | `path` | `string` | File extension (`.pdf`, `.png`) |
| `fs.<space>.Move` | `src`, `dst` | — | Move / rename file |
| `fs.<space>.Copy` | `src`, `dst` | — | Copy file |
| `fs.<space>.Glob` | `pattern` | `string[]` | Match files by glob |
| `fs.<space>.ReadDir` | `path`, `recursive?` | `string[]` | List directory contents |
| `fs.<space>.Abs` | `path` | `string` | ✅ Relative path → OS absolute path |

### Runtime API (`new FS("<space>")`)

TS/JS scripts can directly create an instance with `new FS("data")` and call methods:

```typescript
const fs = new FS("data");
fs.ReadFile("/path/file.txt");       // → string
fs.WriteFile("/path/file.txt", "hello");
fs.MkdirTemp("tmp", "keeper_");     // → relative path
fs.Abs("/tmp/keeper_xxx");           // → OS absolute path ✅ already implemented
fs.MimeType("/path/file.png");      // → "image/png"
fs.Size("/path/file.png");          // → 12345
fs.BaseName("/path/file.png");      // → "file.png"
fs.ExtName("/path/file.png");       // → ".png"
fs.RemoveAll("/tmp/keeper_xxx");    // cleanup
// ... all Process API methods with same names are available
```

> Both Runtime API (`new FS("data").Abs(path)`) and Process API (`fs.data.Abs`) are implemented.

### File System Spaces

| Space | Base path | Typical use |
|-------|-----------|-------------|
| `dsl` | App root (DSL files) | Read model/script definitions |
| `system` | OS filesystem `/` | General file I/O, temp files |
| `data` | App data directory | Application data storage |

Usage pattern: `fs.<space>.<Operation>` — e.g. `fs.data.MkdirTemp`, `fs.data.Abs`.

### Path Behavior

- `fs.data.MkdirTemp("tmp", "keeper_")` → returns **relative path** (e.g. `/tmp/keeper_xxx`)
- `fs.data.Abs("/tmp/keeper_xxx")` / `new FS("data").Abs(...)` → returns **OS absolute path** (e.g. `/home/app/data/tmp/keeper_xxx`)
- `fs.system` root is `/`, so its paths are already OS absolute paths
- Go handlers (pdf, office, ffmpeg) only accept OS absolute paths, so use `data` space + `Abs` conversion

**Keeper usage:** Use `fs.data` space for temporary file management (same partition, good performance) — convert to OS path via `Abs` before passing to Go handlers. File metadata queries (`MimeType`, `Size`, `BaseName`, `ExtName`). Cleanup with `fs.data.RemoveAll`.
