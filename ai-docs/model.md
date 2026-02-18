# Model CRUD (`models.*`)

> **Process group:** `models.{namespace}.{model}`

Standard Yao data model operations.

| Process | Description |
|---------|-------------|
| `models.{ns}.{model}.Get` | Query records with wheres, limit, orders, select |
| `models.{ns}.{model}.Find` | Find single record by ID |
| `models.{ns}.{model}.Paginate` | Paginated query with total count |
| `models.{ns}.{model}.Create` | Create record, returns new ID |
| `models.{ns}.{model}.Update` | Update record by ID, returns nil |
| `models.{ns}.{model}.Save` | Create or update (upsert by PK) |
| `models.{ns}.{model}.Delete` | Delete record by ID (respects soft_deletes) |
| `models.{ns}.{model}.DeleteWhere` | Delete by conditions |

## API Details

### Get

```typescript
const rows = Process("models.{ns}.{model}.Get", {
  wheres: [{ column: "team_id", value: "team-001" }],
  orders: [{ column: "created_at", option: "desc" }],
  select: ["id", "name", "status"],
  limit: 10,
}) as any[];
```

Returns an array of records (may be empty `[]`).

### Find

```typescript
const row = Process("models.{ns}.{model}.Find", id, {}) as any;
```

Returns a single record by primary key. The second argument `{}` is required (query params, can be empty).

### Paginate

```typescript
const result = Process("models.{ns}.{model}.Paginate", queryParams, page, pagesize) as any;
// result.data      — array of records
// result.total     — total count matching the query
// result.page      — current page number
// result.pagesize  — items per page
// result.pagecnt   — total number of pages
// result.next      — next page number (0 if last)
// result.prev      — previous page number (0 if first)
```

`queryParams` supports the same `wheres`, `orders`, `select` as `Get`.

### Create

```typescript
const id = Process("models.{ns}.{model}.Create", row) as number;
```

Returns the new record's primary key (number).

### Update

```typescript
Process("models.{ns}.{model}.Update", id, updates);
```

Updates by primary key. Returns `nil`. Use `Find` after update if you need the full record.

### Save (Upsert)

```typescript
Process("models.{ns}.{model}.Save", row);
```

If `row` contains an `id` field, updates that record. Otherwise creates a new record. This is **PK-based upsert** — it does NOT match on unique business IDs.

### Delete

```typescript
Process("models.{ns}.{model}.Delete", id);
```

For models with `soft_deletes: true`, this sets `deleted_at` instead of physically removing the record. Subsequent `Get`, `Find`, `Paginate` queries automatically filter `deleted_at IS NULL`.

## QueryWhere Structure

```typescript
interface QueryWhere {
  column: string;
  value?: any;
  op?: string;       // "=", "like", ">", "<", ">=", "<=", "!=", "in", "not in"
  method?: string;    // "where" (default), "orwhere"
  wheres?: QueryWhere[]; // Nested group (parenthesized)
}
```

Nested groups example (OR within AND):

```typescript
{
  wheres: [
    { column: "team_id", value: "team-001" },
    {
      method: "where",
      wheres: [
        { column: "title", op: "like", value: "%search%" },
        { column: "content", op: "like", value: "%search%", method: "orwhere" },
      ],
    },
  ],
}
```

## Keeper Models

- `models.agents.yao.keeper.entry` — core data entries
- `models.agents.yao.keeper.collection` — user collections
- `models.agents.yao.keeper.category` — categories
- `models.agents.yao.keeper.config` — team config (integrations JSON)

**Keeper usage:** All CRUD operations for entries, collections, categories, config.
