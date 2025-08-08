# useUrlParams

[![npm version](https://img.shields.io/npm/v/use-url-params?color=blue)](https://www.npmjs.com/package/use-url-params)
[![npm downloads](https://img.shields.io/npm/dw/use-url-params)](https://www.npmjs.com/package/use-url-params)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

A lightweight React hook for managing **URL query parameters** with full TypeScript support and auto-generated helper methods.

Built for [`react-router-dom`](https://reactrouter.com/) (v6+) with **type-safe keys**, **option validation**, and **handy helper flags** like `isViewTable` or `isViewGrid`.

---

## ✨ Features

- 🔒 **Type-safe** query parameter keys and values
- ⚡ **Auto-generated helpers**: `set<Key>`, `toggle<Key>`, `is<Key><Option>`
- 🔄 **Toggle mode** for 2-option parameters
- ✅ Works seamlessly with `react-router-dom`’s `useSearchParams`
- 🪶 Zero dependencies (except React & react-router-dom)

---

## 📦 Installation

```bash
npm react-use-url-params
```
or
```bash
yarn add react-use-url-params
```
## 🚀 Usage

```tsx
import useUrlParams from 'use-url-params';

export default function MyComponent() {
  const { view, setView, toggleView, isViewGrid, isViewTable } = useUrlParams({
    keyName: 'view',
    options: ['grid', 'table'] as const,
  });

  return (
    <div>
      <p>Current view: {view}</p>
      <button onClick={() => setView('grid')}>Grid</button>
      <button onClick={() => setView('table')}>Table</button>
      <button onClick={toggleView}>Toggle</button>

      {isViewGrid && <div>Grid mode enabled</div>}
      {isViewTable && <div>Table mode enabled</div>}
    </div>
  );
}
``` 

### `useUrlParams(config)`

| Option       | Type                              | Description |
|--------------|-----------------------------------|-------------|
| `keyName`    | `string`                          | Query parameter key |
| `options`    | `readonly string[]`               | Allowed values for this param |

**Returns:**
- `[keyName]` — current value (`string` or `null`)
- `set<Key>` — function to set a value
- `toggle<Key>` — toggle between 2 allowed values (only works if `options.length === 2`)
- `is<Key><Option>` — boolean helper for quick checks

      

