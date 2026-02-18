# PDF (`gou/pdf`)

> **Process group:** `pdf` — registered in `gou/pdf/process.go`

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `pdf.Info` | `filePath` | `Info` | Page count, metadata, file size |
| `pdf.Split` | `filePath`, `config` | `string[]` | Split PDF by page ranges, return output file paths |
| `pdf.Convert` | `filePath`, `config` | `string[]` | Convert pages to images (PNG/JPEG), return output file paths |

**Config (`pdf.Convert`):** `format` ("png"/"jpeg"), `dpi` (default: 150), `pages` ("1-3"), `output_dir`, `quality`.
**Config (`pdf.Split`):** `pages` ("1-3,5,7-10"), `pages_per_file`, `output_dir`.

**Conversion tools:** `pdftoppm` (poppler), `mutool` (mupdf), ImageMagick — auto-detected.

**Keeper usage:** PDF Extraction — `pdf.Convert` → page images → OCR/LLM vision → Markdown.
