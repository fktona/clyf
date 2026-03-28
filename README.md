# clyf

Generate TypeScript type files from JSON objects during development.

## Install

```bash
npm install clyf
```

## Usage

clyf exports two methods: `generateTypeFromJson` for generating type files, and `withType` for generating types and returning typed data in one step.

### `generateTypeFromJson` — generate a type file

Use this when you just want to create or update a `.ts` type file from any JSON object.

```typescript
import { generateTypeFromJson } from "clyf";

const res = await fetch("https://api.example.com/users/1");
const data = await res.json();

await generateTypeFromJson("User", data);
// → writes ./types/User.ts

await generateTypeFromJson("User", data, "./src/types");
// → writes ./src/types/User.ts
```

The generated file looks like this:

```typescript
// types/User.ts
export interface User {
  address: Address;
  email:   string;
  id:      number;
  name:    string;
}

export interface Address {
  city:   string;
  street: string;
  zip:    string;
}
```
### `withType<T>` — generate a type file and return typed data

Use this when you want to generate the type file **and** get the data back with the correct TypeScript type in one call.

```typescript
import { withType } from "clyf";
import { User } from "./types/User";

const res = await fetch("https://api.example.com/users/1");
const user = await withType<User>("User", await res.json());

user.name;      // string ✓
user.address;   // Address ✓
```

On the very first run, the type file won't exist yet. Use `any` as the type parameter, run your code once to generate the file, then add the import:

```typescript
// Step 1: first run — generates ./types/User.ts
const user = await withType<any>("User", await res.json());

// Step 2: import the generated type and swap it in
import { User } from "./types/User";
const user = await withType<User>("User", await res.json());
```

Both methods work with any data source — `fetch`, `axios`, GraphQL clients, files, etc. clyf never fetches data itself; you bring the JSON, it generates the types.

## API

### `generateTypeFromJson(typeName, jsonData, typesDir?)`

| Parameter  | Type     | Default    | Description                               |
|------------|----------|------------|-------------------------------------------|
| `typeName` | `string` | —          | Name of the generated interface            |
| `jsonData` | `any`    | —          | A JSON object (e.g. from an API response)  |
| `typesDir` | `string` | `./types`  | Output directory for the generated `.ts` file |

Returns `Promise<void>`.

### `withType<T>(typeName, jsonData, typesDir?)`

| Parameter  | Type     | Default    | Description                               |
|------------|----------|------------|-------------------------------------------|
| `typeName` | `string` | —          | Name of the generated interface            |
| `jsonData` | `any`    | —          | A JSON object (e.g. from an API response)  |
| `typesDir` | `string` | `./types`  | Output directory for the generated `.ts` file |

Returns `Promise<T>` — the same data you passed in, typed as `T`.

## Framework compatibility

clyf runs on **Node.js only** — it uses `fs` to write type files to disk. This means it works anywhere your code runs on a server, but **not** in client-side browser code.

### Works in

- Node.js scripts and CLIs
- Next.js **Server Components** (the default in the App Router)
- Next.js `getServerSideProps` / `getStaticProps`
- Next.js **API Routes** and **Server Actions**
- Express, Fastify, or any Node.js server
- Any server-side runtime with Node.js APIs

### Does NOT work in

- React client components (`"use client"`)
- Browser bundles (Vite, CRA, etc.)
- Edge runtimes without Node.js APIs

### Using clyf with Next.js

In a Server Component, you can generate types and use the data directly:

```typescript
import { withType } from "clyf";
import { User } from "@/types/User";

export default async function UserPage() {
  const res = await fetch("https://api.example.com/users/1");
  const user = await withType<User>("User", await res.json());

  return <div>{user.name}</div>;
}
```

> **Do not** import clyf in files marked with `"use client"` — the build will fail because `fs` is not available in the browser.

For client components, generate your types once on the server side, then import the generated types normally:

```typescript
"use client";
import { User } from "@/types/User"; // just the type, not clyf itself

export function UserCard({ user }: { user: User }) {
  return <div>{user.name}</div>;
}
```

## Behaviour

- Only runs when `NODE_ENV=development`. Does nothing in production.
- Skips regeneration if the JSON structure hasn't changed (uses a SHA-256 hash cache).
- Automatically creates the output directory if it doesn't exist.
- Uses `quicktype-core` under the hood to produce clean TypeScript interfaces.

## Development

```bash
npm run build    # compile to dist/
npm test         # run tests
```
