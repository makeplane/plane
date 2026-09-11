# GraphQL Principles

> Flexible queries for complex, interconnected data.

## When to Use

```
✅ Good fit:
├── Complex, interconnected data
├── Multiple frontend platforms
├── Clients need flexible queries
├── Evolving data requirements
└── Reducing over-fetching matters

❌ Poor fit:
├── Simple CRUD operations
├── File upload heavy
├── HTTP caching important
└── Team unfamiliar with GraphQL
```

## Schema Design Principles

```
Principles:
├── Think in graphs, not endpoints
├── Design for evolvability (no versions)
├── Use connections for pagination
├── Be specific with types (not generic "data")
└── Handle nullability thoughtfully
```

## Security Considerations

```
Protect against:
├── Query depth attacks → Set max depth
├── Query complexity → Calculate cost
├── Batching abuse → Limit batch size
├── Introspection → Disable in production
```

## DataLoader (N+1 Prevention)

Each resolver making its own database query is the single most common GraphQL production issue — a nested query can trigger one query per parent row. Batch and cache within a single request tick using DataLoader (or an equivalent batching utility): collect all keys requested during the tick, issue one batched query, then resolve each individual promise from the batch result. Without it, "the team that didn't use DataLoader had unusable APIs."

## Federation

For microservices, split a single logical graph across multiple services (subgraphs) composed into one supergraph — each service owns its own types/fields, a gateway stitches the schema and routes fields to the owning subgraph. Use when multiple teams/services need to contribute to one GraphQL API without a monolithic resolver layer.

## Subscriptions

Real-time updates over a persistent connection (WebSocket/SSE). Common failure: subscriptions not properly cleaned up on client disconnect — leaked connections and resolvers keep firing. Always tie subscription teardown to connection-close/unsubscribe events.

## Client Integration (Apollo / urql)

- **Apollo Client** — normalized cache with type policies; the standard choice for larger apps needing fine-grained cache control.
- **urql** — lighter-weight alternative with a simpler exchange-based architecture; good fit when Apollo's cache complexity isn't needed.
- Client-side codegen (graphql-codegen) keeps generated types in sync with the schema — treat schema changes as breaking until codegen is re-run.

## Anti-Patterns

- ❌ **No DataLoader** — resolvers issue redundant per-row queries.
- ❌ **No query depth/complexity limiting** — deeply nested or expensive queries can DoS the server; clients can craft queries that take minutes to resolve using their own permitted schema.
- ❌ **Authorization only in schema directives, not resolvers** — directives alone aren't sufficient; enforce authz in resolver logic and at the field level, not just the query level.

## ⚠️ Sharp Edges

| Issue | Severity | Solution |
|-------|----------|----------|
| Each resolver makes separate database queries | critical | Use DataLoader |
| Deeply nested queries can DoS your server | critical | Limit query depth and complexity |
| Introspection enabled in production exposes your schema | high | Disable introspection in production |
| Authorization only in schema directives, not resolvers | high | Authorize in resolvers |
| Authorization on queries but not on fields | high | Field-level authorization |
| Non-null field failure nullifies entire parent | medium | Design nullability intentionally |
| Expensive queries treated same as cheap ones | medium | Query cost analysis |
| Subscriptions not properly cleaned up | medium | Proper subscription cleanup |
