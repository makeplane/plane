# MongoDB Aggregation Pipeline

Aggregation pipeline for complex data transformations, analytics, and multi-stage processing.

## Pipeline Concept

Aggregation processes documents through multiple stages. Each stage transforms documents and passes results to next stage.

```javascript
db.collection.aggregate([
  { /* Stage 1 */ },
  { /* Stage 2 */ },
  { /* Stage 3 */ }
])
```

## Core Pipeline Stages

### $match (Filter Documents)
```javascript
// Filter early in pipeline for efficiency
db.orders.aggregate([
  { $match: { status: "completed", total: { $gte: 100 } } },
  // Subsequent stages process only matched documents
])

// Multiple conditions
db.orders.aggregate([
  { $match: {
    $and: [
      { orderDate: { $gte: startDate } },
      { status: { $in: ["completed", "shipped"] } }
    ]
  }}
])
```

### $project (Reshape Documents)
```javascript
// Select and reshape fields
db.orders.aggregate([
  { $project: {
    orderNumber: 1,
    total: 1,
    customerName: "$customer.name",
    year: { $year: "$orderDate" },
    _id: 0  // Exclude _id
  }}
])

// Computed fields
db.orders.aggregate([
  { $project: {
    total: 1,
    tax: { $multiply: ["$total", 0.1] },
    grandTotal: { $add: ["$total", { $multiply: ["$total", 0.1] }] }
  }}
])
```

### $group (Aggregate Data)
```javascript
// Group and count
db.orders.aggregate([
  { $group: {
    _id: "$status",
    count: { $sum: 1 }
  }}
])

// Multiple aggregations
db.orders.aggregate([
  { $group: {
    _id: "$customerId",
    totalSpent: { $sum: "$total" },
    orderCount: { $sum: 1 },
    avgOrderValue: { $avg: "$total" },
    maxOrder: { $max: "$total" },
    minOrder: { $min: "$total" }
  }}
])

// Group by multiple fields
db.sales.aggregate([
  { $group: {
    _id: {
      year: { $year: "$date" },
      month: { $month: "$date" },
      product: "$productId"
    },
    revenue: { $sum: "$amount" }
  }}
])
```

### $sort (Order Results)
```javascript
// Sort by field
db.orders.aggregate([
  { $sort: { total: -1 } }  // -1: descending, 1: ascending
])

// Sort by multiple fields
db.orders.aggregate([
  { $sort: { status: 1, orderDate: -1 } }
])
```

### $limit / $skip (Pagination)
```javascript
// Limit results
db.orders.aggregate([
  { $sort: { orderDate: -1 } },
  { $limit: 10 }
])

// Pagination
const page = 2;
const pageSize = 20;
db.orders.aggregate([
  { $sort: { orderDate: -1 } },
  { $skip: (page - 1) * pageSize },
  { $limit: pageSize }
])
```

### $lookup (Join Collections)
```javascript
// Simple join
db.orders.aggregate([
  { $lookup: {
    from: "customers",
    localField: "customerId",
    foreignField: "_id",
    as: "customer"
  }},
  { $unwind: "$customer" }  // Convert array to object
])

// Pipeline join (more powerful)
db.orders.aggregate([
  { $lookup: {
    from: "products",
    let: { items: "$items" },
    pipeline: [
      { $match: { $expr: { $in: ["$_id", "$$items.productId"] } } },
      { $project: { name: 1, price: 1 } }
    ],
    as: "productDetails"
  }}
])
```

### $unwind (Deconstruct Arrays)
```javascript
// Unwind array field
db.orders.aggregate([
  { $unwind: "$items" }
])

// Preserve null/empty arrays
db.orders.aggregate([
  { $unwind: {
    path: "$items",
    preserveNullAndEmptyArrays: true
  }}
])

// Include array index
db.orders.aggregate([
  { $unwind: {
    path: "$items",
    includeArrayIndex: "itemIndex"
  }}
])
```

### $addFields (Add New Fields)
```javascript
// Add computed fields
db.orders.aggregate([
  { $addFields: {
    totalWithTax: { $multiply: ["$total", 1.1] },
    year: { $year: "$orderDate" }
  }}
])
```

### $replaceRoot (Replace Document Root)
```javascript
// Promote subdocument to root
db.orders.aggregate([
  { $replaceRoot: { newRoot: "$customer" } }
])

// Merge fields
db.orders.aggregate([
  { $replaceRoot: {
    newRoot: { $mergeObjects: ["$customer", { orderId: "$_id" }] }
  }}
])
```

## Aggregation Operators

### Arithmetic Operators
```javascript
// Basic math
db.products.aggregate([
  { $project: {
    name: 1,
    profit: { $subtract: ["$price", "$cost"] },
    margin: { $multiply: [
      { $divide: [
        { $subtract: ["$price", "$cost"] },
        "$price"
      ]},
      100
    ]}
  }}
])

// Other operators: $add, $multiply, $divide, $mod, $abs, $ceil, $floor, $round
```

### String Operators
```javascript
// String manipulation
db.users.aggregate([
  { $project: {
    fullName: { $concat: ["$firstName", " ", "$lastName"] },
    email: { $toLower: "$email" },
    initials: { $concat: [
      { $substr: ["$firstName", 0, 1] },
      { $substr: ["$lastName", 0, 1] }
    ]}
  }}
])

// Other: $toUpper, $trim, $split, $substr, $regexMatch
```

### Date Operators
```javascript
// Date extraction
db.events.aggregate([
  { $project: {
    event: 1,
    year: { $year: "$timestamp" },
    month: { $month: "$timestamp" },
    day: { $dayOfMonth: "$timestamp" },
    hour: { $hour: "$timestamp" },
    dayOfWeek: { $dayOfWeek: "$timestamp" }
  }}
])

// Date math
db.events.aggregate([
  { $project: {
    event: 1,
    expiresAt: { $add: ["$createdAt", 1000 * 60 * 60 * 24 * 30] }, // +30 days
    ageInDays: { $divide: [
      { $subtract: [new Date(), "$createdAt"] },
      1000 * 60 * 60 * 24
    ]}
  }}
])
```

### Array Operators
```javascript
// Array operations
db.posts.aggregate([
  { $project: {
    title: 1,
    tagCount: { $size: "$tags" },
    firstTag: { $arrayElemAt: ["$tags", 0] },
    lastTag: { $arrayElemAt: ["$tags", -1] },
    hasMongoDBTag: { $in: ["mongodb", "$tags"] }
  }}
])

// Array filtering
db.posts.aggregate([
  { $project: {
    title: 1,
    activeTags: {
      $filter: {
        input: "$tags",
        as: "tag",
        cond: { $ne: ["$$tag.status", "deprecated"] }
      }
    }
  }}
])
```

### Conditional Operators
```javascript
// $cond (ternary)
db.products.aggregate([
  { $project: {
    name: 1,
    status: {
      $cond: {
        if: { $gte: ["$stock", 10] },
        then: "In Stock",
        else: "Low Stock"
      }
    }
  }}
])

// $switch (multiple conditions)
db.orders.aggregate([
  { $project: {
    status: 1,
    priority: {
      $switch: {
        branches: [
          { case: { $gte: ["$total", 1000] }, then: "High" },
          { case: { $gte: ["$total", 100] }, then: "Medium" }
        ],
        default: "Low"
      }
    }
  }}
])
```

## Advanced Patterns

### Time-Based Aggregation
```javascript
// Daily sales
db.orders.aggregate([
  { $match: { orderDate: { $gte: startDate } } },
  { $group: {
    _id: {
      year: { $year: "$orderDate" },
      month: { $month: "$orderDate" },
      day: { $dayOfMonth: "$orderDate" }
    },
    revenue: { $sum: "$total" },
    orderCount: { $sum: 1 }
  }},
  { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
])
```

### Faceted Search
```javascript
// Multiple aggregations in one query
db.products.aggregate([
  { $match: { category: "electronics" } },
  { $facet: {
    priceRanges: [
      { $bucket: {
        groupBy: "$price",
        boundaries: [0, 100, 500, 1000, 5000],
        default: "5000+",
        output: { count: { $sum: 1 } }
      }}
    ],
    topBrands: [
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ],
    avgPrice: [
      { $group: { _id: null, avg: { $avg: "$price" } } }
    ]
  }}
])
```

### Window Functions
```javascript
// Running totals and moving averages
db.sales.aggregate([
  { $setWindowFields: {
    partitionBy: "$region",
    sortBy: { date: 1 },
    output: {
      runningTotal: {
        $sum: "$amount",
        window: { documents: ["unbounded", "current"] }
      },
      movingAvg: {
        $avg: "$amount",
        window: { documents: [-7, 0] }  // Last 7 days
      }
    }
  }}
])
```

### Text Search with Aggregation
```javascript
// Full-text search (requires text index)
db.articles.aggregate([
  { $match: { $text: { $search: "mongodb database" } } },
  { $addFields: { score: { $meta: "textScore" } } },
  { $sort: { score: -1 } },
  { $limit: 10 }
])
```

### Geospatial Aggregation
```javascript
// Find nearby locations
db.places.aggregate([
  { $geoNear: {
    near: { type: "Point", coordinates: [lon, lat] },
    distanceField: "distance",
    maxDistance: 5000,
    spherical: true
  }},
  { $limit: 10 }
])
```

## Performance Tips

1. **$match early** - Filter documents before other stages
2. **$project early** - Reduce document size
3. **Index usage** - $match and $sort can use indexes (only at start)
4. **$limit after $sort** - Reduce memory usage
5. **Avoid $lookup** - Prefer embedded documents when possible
6. **Use $facet sparingly** - Can be memory intensive
7. **allowDiskUse** - Enable for large datasets
```javascript
db.collection.aggregate(pipeline, { allowDiskUse: true })
```

## Best Practices

1. **Order stages efficiently** - $match → $project → $group → $sort → $limit
2. **Use $expr carefully** - Can prevent index usage
3. **Monitor memory** - Default limit: 100MB per stage
4. **Test with explain** - Analyze pipeline performance
```javascript
db.collection.explain("executionStats").aggregate(pipeline)
```
5. **Break complex pipelines** - Use $out/$merge for intermediate results
6. **Use $sample** - For random document selection
7. **Leverage $addFields** - Cleaner than $project for adding fields
