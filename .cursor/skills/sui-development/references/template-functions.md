# Template Functions Reference

SUI uses [Expr](https://expr-lang.org/) (v1.17) as the expression engine. This reference covers SUI custom functions and commonly used Expr built-in functions.

## SUI Custom Functions

| Function        | Description                    | Example                           |
| --------------- | ------------------------------ | --------------------------------- |
| `P_(proc, ...)` | Call a Yao process             | `{{ P_('models.user.Find', 1) }}` |
| `True(value)`   | Check if value is truthy       | `{{ True(user) }}`                |
| `False(value)`  | Check if value is falsy        | `{{ False(error) }}`              |
| `Empty(value)`  | Check if array/object is empty | `{{ Empty(items) }}`              |

### P_() - Process Call

Call a Yao process directly in templates:

```html
<!-- Simple call -->
<span>{{ P_('utils.formatDate', createdAt) }}</span>

<!-- With multiple arguments -->
<span>{{ P_('utils.calculate', price, quantity, discount) }}</span>

<!-- In conditions -->
<div s:if="{{ P_('auth.hasPermission', 'admin') }}">Admin Panel</div>
```

### True() / False()

Check boolean values:

```html
<div s:if="{{ True(user) }}">User exists</div>
<div s:if="{{ False(error) }}">No error</div>

<!-- Equivalent to -->
<div s:if="{{ user != null && user != false && user != 0 }}">User exists</div>
```

### Empty()

Check if array or object is empty:

```html
<div s:if="{{ Empty(items) }}">No items</div>
<div s:if="{{ !Empty(items) }}">{{ len(items) }} items found</div>
<div s:if="{{ Empty(settings) }}">No settings configured</div>
```

## Array Functions

| Function              | Description                    | Example                           |
| --------------------- | ------------------------------ | --------------------------------- |
| `len(array)`          | Get length of array/string/map | `{{ len(items) }}`                |
| `all(array, pred)`    | Check if all elements match    | `{{ all(users, .active) }}`       |
| `any(array, pred)`    | Check if any element matches   | `{{ any(items, .price > 100) }}`  |
| `one(array, pred)`    | Check if exactly one matches   | `{{ one(users, .admin) }}`        |
| `none(array, pred)`   | Check if no elements match     | `{{ none(items, .deleted) }}`     |
| `map(array, mapper)`  | Transform array elements       | `{{ map(users, .name) }}`         |
| `filter(array, pred)` | Filter array by predicate      | `{{ filter(items, .active) }}`    |
| `find(array, pred)`   | Find first matching element    | `{{ find(users, .id == 1) }}`     |
| `count(array, pred)`  | Count matching elements        | `{{ count(items, .price > 50) }}` |
| `first(array)`        | First element                  | `{{ first(items) }}`              |
| `last(array)`         | Last element                   | `{{ last(items) }}`               |
| `take(array, n)`      | Take first n elements          | `{{ take(items, 5) }}`            |

### Examples

```html
<!-- Array length -->
<span>Total: {{ len(items) }} items</span>

<!-- Count with condition -->
<span>Active: {{ count(users, .active) }} users</span>

<!-- Map to extract field -->
<span>Names: {{ join(map(users, .name), ', ') }}</span>

<!-- Filter and iterate -->
<div s:for="{{ filter(items, .price > 100) }}" s:for-item="item">
  {{ item.name }} - ${{ item.price }}
</div>

<!-- Find single item -->
<s:set name="admin" value="{{ find(users, .role == 'admin') }}" />
<span s:if="{{ admin }}">Admin: {{ admin.name }}</span>

<!-- Check conditions -->
<div s:if="{{ all(items, .inStock) }}">All items in stock</div>
<div s:if="{{ any(items, .onSale) }}">Sale items available!</div>
```

## Math Functions

| Function      | Description               | Example              |
| ------------- | ------------------------- | -------------------- |
| `sum(array)`  | Sum of array elements     | `{{ sum(prices) }}`  |
| `mean(array)` | Average of array elements | `{{ mean(scores) }}` |
| `min(array)`  | Minimum value             | `{{ min(prices) }}`  |
| `max(array)`  | Maximum value             | `{{ max(scores) }}`  |

### Examples

```html
<!-- Statistics -->
<span>Total: ${{ sum(map(items, .price)) }}</span>
<span>Average: {{ mean(scores) }}</span>
<span>Range: {{ min(prices) }} - {{ max(prices) }}</span>

<!-- Calculate total with quantity -->
<s:set name="total" value="{{ sum(map(items, .price * .quantity)) }}" />
<span>Order Total: ${{ total }}</span>
```

## Map/Object Functions

| Function       | Description    | Example                  |
| -------------- | -------------- | ------------------------ |
| `keys(map)`    | Get map keys   | `{{ keys(settings) }}`   |
| `values(map)`  | Get map values | `{{ values(settings) }}` |

### Examples

```html
<!-- Iterate object -->
<dl s:for="{{ settings }}" s:for-item="value" s:for-index="key">
  <dt>{{ key }}</dt>
  <dd>{{ value }}</dd>
</dl>

<!-- Get keys -->
<span>Settings: {{ join(keys(settings), ', ') }}</span>
```

## String Functions

| Function             | Description         | Example                          |
| -------------------- | ------------------- | -------------------------------- |
| `contains(a, b)`     | Check if a contains b | `{{ contains(name, 'test') }}` |
| `startsWith(s, pre)` | Check string prefix | `{{ startsWith(url, 'https') }}` |
| `endsWith(s, suf)`   | Check string suffix | `{{ endsWith(file, '.pdf') }}`   |
| `upper(s)`           | Uppercase string    | `{{ upper(name) }}`              |
| `lower(s)`           | Lowercase string    | `{{ lower(email) }}`             |
| `trim(s)`            | Trim whitespace     | `{{ trim(input) }}`              |
| `split(s, sep)`      | Split string        | `{{ split(tags, ',') }}`         |
| `join(array, sep)`   | Join array to string | `{{ join(names, ', ') }}`       |

### Examples

```html
<!-- String checks -->
<div s:if="{{ contains(title, 'urgent') }}">URGENT</div>
<div s:if="{{ endsWith(filename, '.pdf') }}">PDF Document</div>

<!-- Transform -->
<span>{{ upper(firstName) }} {{ upper(lastName) }}</span>
<span>{{ trim(input) }}</span>

<!-- Split and join -->
<span s:for="{{ split(tags, ',') }}" s:for-item="tag" class="tag">
  {{ trim(tag) }}
</span>
<span>Authors: {{ join(map(authors, .name), ' & ') }}</span>
```

## Type Conversion

| Function    | Description        | Example              |
| ----------- | ------------------ | -------------------- |
| `int(v)`    | Convert to integer | `{{ int(value) }}`   |
| `float(v)`  | Convert to float   | `{{ float(value) }}` |
| `string(v)` | Convert to string  | `{{ string(count) }}`|

### Examples

```html
<span>Page {{ int(query.page) ?? 1 }}</span>
<span>Price: ${{ float(price) }}</span>
<input value="{{ string(count) }}" />
```

## Date/Time Functions

| Function       | Description           | Example                     |
| -------------- | --------------------- | --------------------------- |
| `now()`        | Current time          | `{{ now() }}`               |
| `date(s)`      | Parse date string     | `{{ date('2024-01-01') }}`  |
| `duration(s)`  | Parse duration string | `{{ duration('1h30m') }}`   |

### Examples

```html
<span>Current time: {{ now() }}</span>
<span>Event date: {{ date(eventDate) }}</span>
```

## Comparison Operators

| Operator | Description           |
| -------- | --------------------- |
| `==`     | Equal                 |
| `!=`     | Not equal             |
| `>`      | Greater than          |
| `<`      | Less than             |
| `>=`     | Greater than or equal |
| `<=`     | Less than or equal    |
| `&&`     | Logical AND           |
| `\|\|`   | Logical OR            |
| `!`      | Logical NOT           |

### Examples

```html
<div s:if="{{ status == 'active' }}">Active</div>
<div s:if="{{ count > 0 && count < 100 }}">Valid range</div>
<div s:if="{{ isAdmin || hasPermission }}">Access granted</div>
<div s:if="{{ !isLocked }}">Unlocked</div>
```

## Null Coalescing

```html
<!-- Default value if null -->
<span>{{ title ?? 'Untitled' }}</span>
<span>{{ user.name ?? 'Anonymous' }}</span>
<span>{{ settings.theme ?? 'light' }}</span>
```

## Ternary Operator

```html
<!-- Conditional value -->
<span>{{ count > 0 ? 'Has items' : 'Empty' }}</span>
<span class="{{ isActive ? 'active' : 'inactive' }}">Status</span>
<a href="{{ isLoggedIn ? '/dashboard' : '/login' }}">
  {{ isLoggedIn ? 'Dashboard' : 'Login' }}
</a>
```

## Arithmetic

```html
<!-- Basic math -->
<span>{{ price * quantity }}</span>
<span>{{ total / count }}</span>
<span>{{ value + 10 }}</span>
<span>{{ index - 1 }}</span>

<!-- Percentage -->
<span>{{ (completed / total) * 100 }}%</span>

<!-- Complex expression -->
<span>{{ (price * quantity) * (1 - discount / 100) }}</span>
```

## Complete Examples

```html
<!-- Shopping cart summary -->
<div class="cart-summary">
  <span>Items: {{ len(items) }}</span>
  <span>Subtotal: ${{ sum(map(items, .price * .quantity)) }}</span>
  <span s:if="{{ any(items, .onSale) }}">Includes sale items!</span>
</div>

<!-- User list with filters -->
<div class="user-list">
  <h3>Active Users ({{ count(users, .active) }})</h3>
  <div s:for="{{ filter(users, .active) }}" s:for-item="user">
    <span>{{ upper(first(split(user.name, ' '))) }}</span>
    <span>{{ user.email }}</span>
  </div>
</div>

<!-- Conditional rendering -->
<div s:if="{{ Empty(items) }}">
  <p>No items found</p>
</div>
<div s:elif="{{ len(items) == 1 }}">
  <p>Found 1 item: {{ first(items).name }}</p>
</div>
<div s:else>
  <p>Found {{ len(items) }} items</p>
  <ul>
    <li s:for="{{ take(items, 5) }}" s:for-item="item">
      {{ item.name }} - ${{ item.price }}
    </li>
  </ul>
  <p s:if="{{ len(items) > 5 }}">
    And {{ len(items) - 5 }} more...
  </p>
</div>
```

## Reference

For the complete list of Expr built-in functions and operators, see:
- [Expr Language Definition](https://expr-lang.org/docs/language-definition)
- [Expr Built-in Functions](https://expr-lang.org/docs/builtin-functions)
