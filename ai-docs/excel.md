# Excel (`yao/excel`)

> **Process group:** `excel`

Full Excel (.xlsx) read/write via `excelize/v2`.

### File lifecycle

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `excel.open` | `file`, `writable?` | `string` (handle) | Open file, returns handle ID |
| `excel.close` | `handle` | — | Close file |
| `excel.save` | `handle` | — | Save changes |
| `excel.sheets` | `handle` | `string[]` | List sheet names |

### Read operations

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `excel.read.cell` | `handle`, `sheet`, `cell` | `string` | Read single cell |
| `excel.read.row` | `handle`, `sheet` | `string[][]` | Read all rows |
| `excel.read.column` | `handle`, `sheet` | `string[][]` | Read all columns |
| `excel.sheet.read` | `handle`, `name` | `any[][]` | Read full sheet data |
| `excel.sheet.rows` | `handle`, `name`, `start`, `size` | `string[][]` | Paginated row read |
| `excel.sheet.dimension` | `handle`, `name` | `{rows, cols}` | Get sheet dimensions |

### Write operations

| Process | Args | Description |
|---------|------|-------------|
| `excel.write.cell` | `handle`, `sheet`, `cell`, `value` | Write single cell |
| `excel.write.row` | `handle`, `sheet`, `cell`, `values` | Write row |
| `excel.write.column` | `handle`, `sheet`, `cell`, `values` | Write column |
| `excel.write.all` | `handle`, `sheet`, `cell`, `values` | Write region |

### Iterators (streaming large files)

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `excel.each.openrow` | `handle`, `sheet` | `string` (iterID) | Open row iterator |
| `excel.each.nextrow` | `iterID` | `string[]` or `null` | Next row |
| `excel.each.closerow` | `iterID` | — | Close iterator |

**Keeper usage:** Spreadsheet Parsing — open uploaded .xlsx, iterate rows, detect headers, convert to Markdown table.
