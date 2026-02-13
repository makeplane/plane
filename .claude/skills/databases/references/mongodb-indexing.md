# MongoDB Indexing and Performance

Index types, strategies, and performance optimization techniques for MongoDB.

## Index Fundamentals

Indexes improve query performance by allowing MongoDB to scan fewer documents. Without indexes, MongoDB performs collection scans (reads every document).

```javascript
// Check if query uses index
db.users.find({ email: "user@example.com" }).explain("executionStats")

// Key metrics:
// - executionTimeMillis: query duration
// - totalDocsExamined: documents scanned
// - nReturned: documents returned
// - stage: IXSCAN (index) vs COLLSCAN (full scan)
```

## Index Types

### Single Field Index
```javascript
// Create index on single field
db.users.createIndex({ email: 1 })  // 1: ascending, -1: descending

// Use case: queries filtering by email
db.users.find({ email: "user@example.com" })

// Drop index
db.users.dropIndex({ email: 1 })
db.users.dropIndex("email_1")  // By name
```

### Compound Index
```javascript
// Index on multiple fields (order matters!)
db.orders.createIndex({ status: 1, createdAt: -1 })

// Supports queries on:
// 1. { status: "..." }
// 2. { status: "...", createdAt: ... }
// Does NOT efficiently support: { createdAt: ... } alone

// Left-to-right prefix rule
db.orders.createIndex({ a: 1, b: 1, c: 1 })
// Supports: {a}, {a,b}, {a,b,c}
// Not: {b}, {c}, {b,c}
```

### Text Index (Full-Text Search)
```javascript
// Create text index
db.articles.createIndex({ title: "text", body: "text" })

// Only one text index per collection
db.articles.createIndex({
  title: "text",
  body: "text",
  tags: "text"
}, {
  weights: {
    title: 10,    // Title matches weighted higher
    body: 5,
    tags: 3
  }
})

// Search
db.articles.find({ $text: { $search: "mongodb database" } })

// Search with score
db.articles.find(
  { $text: { $search: "mongodb" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })
```

### Geospatial Indexes
```javascript
// 2dsphere index (spherical geometry)
db.places.createIndex({ location: "2dsphere" })

// Document format
db.places.insertOne({
  name: "Coffee Shop",
  location: {
    type: "Point",
    coordinates: [-73.97, 40.77]  // [longitude, latitude]
  }
})

// Find nearby
db.places.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [-73.97, 40.77] },
      $maxDistance: 5000  // meters
    }
  }
})

// Within polygon
db.places.find({
  location: {
    $geoWithin: {
      $geometry: {
        type: "Polygon",
        coordinates: [[
          [lon1, lat1], [lon2, lat2], [lon3, lat3], [lon1, lat1]
        ]]
      }
    }
  }
})
```

### Wildcard Index
```javascript
// Index all fields in subdocuments
db.products.createIndex({ "attributes.$**": 1 })

// Supports queries on any nested field
db.products.find({ "attributes.color": "red" })
db.products.find({ "attributes.size": "large" })

// Specific paths only
db.products.createIndex(
  { "$**": 1 },
  { wildcardProjection: { "attributes.color": 1, "attributes.size": 1 } }
)
```

### Hashed Index
```javascript
// Hashed index (for even distribution in sharding)
db.users.createIndex({ userId: "hashed" })

// Use case: shard key
sh.shardCollection("mydb.users", { userId: "hashed" })
```

### TTL Index (Auto-Expiration)
```javascript
// Delete documents after specified time
db.sessions.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }  // 1 hour
)

// Documents automatically deleted after createdAt + 3600 seconds
// Background task runs every 60 seconds
```

### Partial Index
```javascript
// Index only documents matching filter
db.orders.createIndex(
  { customerId: 1 },
  { partialFilterExpression: { status: "active" } }
)

// Index only used when query includes filter
db.orders.find({ customerId: "123", status: "active" })  // Uses index
db.orders.find({ customerId: "123" })  // Does not use index
```

### Unique Index
```javascript
// Enforce uniqueness
db.users.createIndex({ email: 1 }, { unique: true })

// Compound unique index
db.users.createIndex({ firstName: 1, lastName: 1 }, { unique: true })

// Sparse unique index (null values not indexed)
db.users.createIndex({ email: 1 }, { unique: true, sparse: true })
```

### Sparse Index
```javascript
// Index only documents with field present
db.users.createIndex({ phoneNumber: 1 }, { sparse: true })

// Useful for optional fields
// Documents without phoneNumber not in index
```

## Index Management

### List Indexes
```javascript
// Show all indexes
db.collection.getIndexes()

// Index statistics
db.collection.aggregate([{ $indexStats: {} }])
```

### Create Index Options
```javascript
// Background index (doesn't block operations)
db.collection.createIndex({ field: 1 }, { background: true })

// Index name
db.collection.createIndex({ field: 1 }, { name: "custom_index_name" })

// Case-insensitive index (collation)
db.collection.createIndex(
  { name: 1 },
  { collation: { locale: "en", strength: 2 } }
)
```

### Hide/Unhide Index
```javascript
// Hide index (test before dropping)
db.collection.hideIndex("index_name")

// Check performance without index
// ...

// Unhide or drop
db.collection.unhideIndex("index_name")
db.collection.dropIndex("index_name")
```

### Rebuild Indexes
```javascript
// Rebuild all indexes (after data changes)
db.collection.reIndex()

// Useful after bulk deletions to reclaim space
```

## Query Optimization

### Covered Queries
```javascript
// Query covered by index (no document fetch)
db.users.createIndex({ email: 1, name: 1 })

// Covered query (all fields in index)
db.users.find(
  { email: "user@example.com" },
  { email: 1, name: 1, _id: 0 }  // Must exclude _id
)

// Check with explain: stage should be "IXSCAN" with no "FETCH"
```

### Index Intersection
```javascript
// MongoDB can use multiple indexes
db.collection.createIndex({ a: 1 })
db.collection.createIndex({ b: 1 })

// Query may use both indexes
db.collection.find({ a: 1, b: 1 })

// Usually compound index is better
db.collection.createIndex({ a: 1, b: 1 })
```

### Index Hints
```javascript
// Force specific index
db.orders.find({ status: "active", city: "NYC" })
  .hint({ status: 1, createdAt: -1 })

// Force no index (for testing)
db.orders.find({ status: "active" }).hint({ $natural: 1 })
```

### ESR Rule (Equality, Sort, Range)
```javascript
// Optimal compound index order: Equality → Sort → Range

// Query
db.orders.find({
  status: "completed",        // Equality
  category: "electronics"     // Equality
}).sort({
  orderDate: -1               // Sort
}).limit(10)

// Optimal index
db.orders.createIndex({
  status: 1,      // Equality first
  category: 1,    // Equality
  orderDate: -1   // Sort last
})

// With range
db.orders.find({
  status: "completed",        // Equality
  total: { $gte: 100 }       // Range
}).sort({
  orderDate: -1               // Sort
})

// Optimal index
db.orders.createIndex({
  status: 1,      // Equality
  orderDate: -1,  // Sort
  total: 1        // Range last
})
```

## Performance Analysis

### explain() Modes
```javascript
// Query planner (default)
db.collection.find({ field: value }).explain()

// Execution stats
db.collection.find({ field: value }).explain("executionStats")

// All execution stats
db.collection.find({ field: value }).explain("allPlansExecution")
```

### Key Metrics
```javascript
// Good performance indicators:
// - executionTimeMillis < 100ms
// - totalDocsExamined ≈ nReturned (examine only what's needed)
// - stage: "IXSCAN" (using index)
// - totalKeysExamined ≈ nReturned (index selectivity)

// Bad indicators:
// - stage: "COLLSCAN" (full collection scan)
// - totalDocsExamined >> nReturned (scanning too many docs)
// - executionTimeMillis > 1000ms
```

### Index Selectivity
```javascript
// High selectivity = good (returns few documents)
// Low selectivity = bad (returns many documents)

// Check selectivity
db.collection.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Good for indexing: email, userId, orderId
// Bad for indexing: gender, status (few unique values)
```

## Index Strategies

### Multi-Tenant Applications
```javascript
// Always filter by tenant first
db.data.createIndex({ tenantId: 1, createdAt: -1 })

// All queries include tenantId
db.data.find({ tenantId: "tenant1", createdAt: { $gte: date } })
```

### Time-Series Data
```javascript
// Index on timestamp descending (recent data accessed more)
db.events.createIndex({ timestamp: -1 })

// Compound with filter fields
db.events.createIndex({ userId: 1, timestamp: -1 })
```

### Lookup Optimization
```javascript
// Index foreign key fields
db.orders.createIndex({ customerId: 1 })
db.customers.createIndex({ _id: 1 })  // Default _id index

// Aggregation $lookup uses these indexes
```

## Best Practices

1. **Create indexes for frequent queries** - Analyze slow query logs
2. **Limit number of indexes** - Each index adds write overhead
3. **Use compound indexes** - More efficient than multiple single indexes
4. **Follow ESR rule** - Equality, Sort, Range order
5. **Use covered queries** - When possible, avoid document fetches
6. **Monitor index usage** - Drop unused indexes
```javascript
db.collection.aggregate([{ $indexStats: {} }])
```
7. **Partial indexes for filtered queries** - Reduce index size
8. **Consider index size** - Should fit in RAM
```javascript
db.collection.stats().indexSizes
```
9. **Background index creation** - Don't block operations (deprecated in 4.2+)
10. **Test with explain** - Verify query plan before production

## Common Pitfalls

1. **Over-indexing** - Too many indexes slow writes
2. **Unused indexes** - Waste space and write performance
3. **Regex without prefix** - `/pattern/` can't use index, `/^pattern/` can
4. **$ne, $nin queries** - Often scan entire collection
5. **$or with multiple branches** - May not use indexes efficiently
6. **Sort without index** - In-memory sort limited to 32MB
7. **Compound index order** - Wrong order makes index useless
8. **Case-sensitive queries** - Use collation for case-insensitive

## Monitoring

```javascript
// Current operations
db.currentOp()

// Slow queries (enable profiling)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(10)

// Index statistics
db.collection.aggregate([
  { $indexStats: {} },
  { $sort: { "accesses.ops": -1 } }
])

// Collection statistics
db.collection.stats()
```

## Index Size Calculation

```javascript
// Check index sizes
db.collection.stats().indexSizes

// Total index size
db.collection.totalIndexSize()

// Recommend: indexes fit in RAM
// Monitor: db.serverStatus().mem
```
