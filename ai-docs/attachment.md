# Attachment Storage (`yao/attachment`)

> **Process group:** `attachment`

File storage with metadata, permissions, and multiple backends.

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `attachment.Save` | `uploaderID`, `content` (base64 data URI), `filename?`, `option?` | `File` | Save file |
| `attachment.Read` | `uploaderID`, `fileID` | `string` (data URI) | Read file as base64 |
| `attachment.Info` | `uploaderID`, `fileID` | `File` | Get file metadata |
| `attachment.List` | `uploaderID`, `option?` | `ListResult` | List files with pagination |
| `attachment.Delete` | `uploaderID`, `fileID` | `bool` | Delete file |
| `attachment.Exists` | `uploaderID`, `fileID` | `bool` | Check if file exists |
| `attachment.URL` | `uploaderID`, `fileID` | `string` | Get file URL (presigned for S3) |
| `attachment.SaveText` | `uploaderID`, `fileID`, `text` | `bool` | Save parsed text content alongside file |
| `attachment.GetText` | `uploaderID`, `fileID`, `fullContent?` | `string` | Get parsed text (preview or full) |

**Storage backends:**
- **Local filesystem** — files at `{path}/{groups}/{filename}`, optional gzip
- **AWS S3** — files at `{prefix}/{groups}/{filename}`, presigned URLs

**Save options:**
- `groups` — subdirectory grouping
- `gzip` — compress on save, decompress on read
- `compress_image` — resize images on save
- `compress_size` — target size for image compression
- `public` / `share` — access control flags

**File reference format:** `__<uploader>://<fileID>` (e.g. `__yao.attachment://abc123`)

**Metadata stored in DB:** `file_id`, `uploader`, `content_type`, `name`, `path`, `bytes`, `status`, `groups`, `gzip`, `public`, `share`, `content`, `content_preview`

**Keeper usage:** Store raw HTML snapshots, downloaded images, PDF files, thumbnails. Reference in entry content as `attachment://file-id`.
