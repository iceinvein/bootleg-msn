---
inclusion: fileMatch
fileMatchPattern: 'convex/*'
---

# Convex Backend Development Rules

## Function Guidelines

### New Function Syntax

- ALWAYS use the new function syntax for Convex functions:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
export const f = query({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        // Function body
    },
});
```

### Function Registration

- Use `internalQuery`, `internalMutation`, and `internalAction` for private functions
- Use `query`, `mutation`, and `action` for public API functions
- ALWAYS include argument and return validators for all functions
- If a function doesn't return anything, include `returns: v.null()`

### Function Calling

- Use `ctx.runQuery` to call a query from a query, mutation, or action
- Use `ctx.runMutation` to call a mutation from a mutation or action
- Use `ctx.runAction` to call an action from an action
- All calls take a `FunctionReference` - do NOT pass the function directly

## Validators

### Core Validator Types

- Use `v.null()` when returning null values
- Use `v.int64()` instead of deprecated `v.bigint()`
- Use `v.record()` for record types (not `v.map()` or `v.set()`)
- Use `v.id(tableName)` for document IDs

### Validator Examples

```typescript
// Array validator
args: {
    simpleArray: v.array(v.union(v.string(), v.number())),
}

// Discriminated union
v.union(
    v.object({
        kind: v.literal("error"),
        errorMessage: v.string(),
    }),
    v.object({
        kind: v.literal("success"),
        value: v.number(),
    }),
)
```

## Schema Guidelines

- Always define schema in `convex/schema.ts`
- Import schema functions from `convex/server`
- Include all index fields in the index name (e.g., "by_field1_and_field2")
- Index fields must be queried in the same order they are defined
- System fields `_creationTime` and `_id` are automatically added

## Query Guidelines

- Do NOT use `filter` in queries - define indexes and use `withIndex` instead
- Use `.unique()` to get a single document (throws error if multiple matches)
- Use `.order('asc')` or `.order('desc')` for ordering (defaults to ascending)
- For async iteration, use `for await (const row of query)` instead of `.collect()`

### Pagination

```typescript
import { paginationOptsValidator } from "convex/server";
export const listWithPagination = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});
```

## Mutation Guidelines

- Use `ctx.db.replace` to fully replace an existing document
- Use `ctx.db.patch` to shallow merge updates into existing document
- Both methods throw errors if document doesn't exist

## Action Guidelines

- Add `"use node";` to top of files using Node.js built-in modules
- Never use `ctx.db` inside actions - actions don't have database access
- Always add `@types/node` to package.json when using Node.js modules

## TypeScript Guidelines

- Use `Id<'tableName'>` type from `./_generated/dataModel` for document IDs
- Be strict with types, especially around document IDs
- Use `as const` for string literals in discriminated unions
- Define arrays as `const array: Array<T> = [...];`
- Define records as `const record: Record<KeyType, ValueType> = {...};`

## File Storage Guidelines

- Use `ctx.storage.getUrl()` for signed URLs (returns null if file doesn't exist)
- Query `_storage` system table for metadata instead of deprecated `ctx.storage.getMetadata`
- Convert items to/from `Blob` when using Convex storage

## Authentication & Security

- Always use `getAuthUserId(ctx)` for authentication checks
- Validate user permissions before database operations
- Handle edge cases like missing documents gracefully
- Use proper error messages that don't leak sensitive information

## Performance & Best Practices

- Use proper indexing for query performance
- Consider migration impact when changing schemas
- Maintain backward compatibility when possible
- Add descriptive function names that indicate purpose
- Include proper error handling for all database operations
