# Text Processing (`gou/text`)

> **Process group:** `text`

HTML/Markdown conversion and LLM output extraction.

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `text.HTMLToMarkdown` | `html` | `string` | Convert HTML → Markdown (goquery-based) |
| `text.MarkdownToHTML` | `markdown` | `string` | Convert Markdown → HTML (GFM support) |
| `text.Extract` | `text` | `CodeBlock[]` | Extract code blocks from LLM output |
| `text.ExtractFirst` | `text` | `CodeBlock` | Extract first code block |
| `text.ExtractJSON` | `text` | `any` | Extract and parse first JSON/YAML block |
| `text.ExtractByType` | `text`, `type` | `CodeBlock[]` | Extract blocks of specific type |

**CodeBlock format:**

```typescript
{
  type: string;     // "json", "html", "markdown", "python", etc.
  content: string;  // Raw content
  data?: any;       // Parsed data (for JSON/YAML)
  start?: number;
  end?: number;
}
```

**HTML → Markdown conversion library:** `github.com/JohannesKaufmann/html-to-markdown/v2`
**Markdown → HTML conversion library:** `github.com/yuin/goldmark` with GFM extensions

**Keeper usage:** Convert fetched HTML pages to Markdown (`text.HTMLToMarkdown`), parse LLM-generated metadata (`text.ExtractJSON`), render stored Markdown for SUI pages (`text.MarkdownToHTML`).

---

## `text.ExtractJSON` — LLM JSON 解析最佳实践

从 LLM 响应中提取结构化 JSON 数据时，**优先使用 `text.ExtractJSON`**，不要手写正则。

它由 Go 层实现，比 JS 正则更健壮，支持以下格式：

- 纯 JSON 字符串：`{"key": "value"}`
- Markdown code block 包裹：` ```json\n{...}\n``` `
- YAML 块（自动转为 JSON 对象）
- 文本中嵌入的 JSON（自动提取第一个有效块）

**返回值：** 解析后的对象（object/array），解析失败返回 `null`。

```typescript
// keeper.classify — 解析 LLM 分类结果
const data = Process("text.ExtractJSON", llmResponseText);
if (data && typeof data === "object") {
  // data 就是 { category, tags, summary, ... }
}

// 也可用于任何需要从 LLM 输出中提取结构化数据的场景
const result = Process("text.ExtractJSON", '```json\n{"keywords": ["ai", "ml"]}\n```');
// result = { keywords: ["ai", "ml"] }
```

**注意：** 不要自己写 `JSON.parse` + 正则来处理 LLM 输出，`text.ExtractJSON` 已经覆盖了所有常见格式。
