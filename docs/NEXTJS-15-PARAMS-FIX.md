# Next.js 15 Dynamic Route Params Fix

## Issue

When deploying to Vercel with Next.js 15, you may encounter this TypeScript error:

```
Type error: Type 'typeof import("/vercel/path0/src/app/api/admin/cms/assets/[id]/route")'
does not satisfy the constraint 'RouteHandlerConfig<"/api/admin/cms/assets/[id]">'.
  Types of property 'DELETE' are incompatible.
    Type '(request: NextRequest, { params }: { params: { id: string; }; }) => ...'
    is not assignable to type '(request: NextRequest, context: { params: Promise<{ id: string; }>; }) => ...'.
```

## Root Cause

In **Next.js 15**, the `params` object in dynamic route handlers (`[id]`, `[slug]`, etc.) is now a **Promise** that must be awaited, rather than a synchronous object.

## Solution

### Before (Next.js 14 and earlier):

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Direct access to params.id
  const id = params.id;
  // ... rest of code
}
```

### After (Next.js 15):

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise first
  const { id } = await params;
  // ... rest of code
}
```

## Files Fixed

All dynamic route handlers have been updated:

1. **`src/app/api/admin/cms/pages/[id]/route.ts`**
   - GET, PUT, DELETE handlers

2. **`src/app/api/admin/cms/assets/[id]/route.ts`**
   - DELETE handler

3. **`src/app/api/admin/cms/settings/[id]/route.ts`**
   - PUT, DELETE handlers

## Pattern to Follow

For any new dynamic routes, always use this pattern:

```typescript
export async function HANDLER_NAME(
  request: NextRequest,
  { params }: { params: Promise<{ paramName: string }> }
) {
  // Await params at the start of the function
  const { paramName } = await params;

  // Now use paramName in your logic
  // ...
}
```

## Why This Change?

Next.js 15 made `params` async to enable better:

- **Performance optimization** - params can be loaded lazily
- **Streaming** - better support for streaming responses
- **Type safety** - ensures async operations are handled correctly

## References

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Dynamic Route Segments](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)

---

**Fixed**: 2025-10-07
