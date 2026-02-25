# MongoDB CRUD Operations

CRUD operations (Create, Read, Update, Delete) in MongoDB with query operators and atomic updates.

## Create Operations

### insertOne
```javascript
// Insert single document
db.users.insertOne({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
  createdAt: new Date()
})

// Returns: { acknowledged: true, insertedId: ObjectId("...") }
```

### insertMany
```javascript
// Insert multiple documents
db.users.insertMany([
  { name: "Bob", age: 25 },
  { name: "Charlie", age: 35 },
  { name: "Diana", age: 28 }
])

// With ordered: false (continue on error)
db.users.insertMany(docs, { ordered: false })
```

## Read Operations

### find
```javascript
// Find all documents
db.users.find()

// Find with filter
db.users.find({ age: { $gte: 18 } })

// Projection (select fields)
db.users.find({ status: "active" }, { name: 1, email: 1, _id: 0 })

// Cursor operations
db.users.find()
  .sort({ createdAt: -1 })
  .limit(10)
  .skip(20)
```

### findOne
```javascript
// Get single document
db.users.findOne({ email: "alice@example.com" })

// With projection
db.users.findOne({ _id: ObjectId("...") }, { name: 1, email: 1 })
```

### count/estimatedDocumentCount
```javascript
// Count matching documents
db.users.countDocuments({ status: "active" })

// Fast estimate (uses metadata)
db.users.estimatedDocumentCount()
```

### distinct
```javascript
// Get unique values
db.users.distinct("status")
db.users.distinct("city", { country: "USA" })
```

## Update Operations

### updateOne
```javascript
// Update first matching document
db.users.updateOne(
  { email: "alice@example.com" },
  { $set: { status: "verified" } }
)

// Upsert (insert if not exists)
db.users.updateOne(
  { email: "new@example.com" },
  { $set: { name: "New User" } },
  { upsert: true }
)
```

### updateMany
```javascript
// Update all matching documents
db.users.updateMany(
  { lastLogin: { $lt: cutoffDate } },
  { $set: { status: "inactive" } }
)

// Multiple updates
db.users.updateMany(
  { status: "pending" },
  {
    $set: { status: "active" },
    $currentDate: { updatedAt: true }
  }
)
```

### replaceOne
```javascript
// Replace entire document (except _id)
db.users.replaceOne(
  { _id: ObjectId("...") },
  { name: "Alice", email: "alice@example.com", age: 31 }
)
```

## Delete Operations

### deleteOne
```javascript
// Delete first matching document
db.users.deleteOne({ email: "alice@example.com" })
```

### deleteMany
```javascript
// Delete all matching documents
db.users.deleteMany({ status: "deleted" })

// Delete all documents in collection
db.users.deleteMany({})
```

## Query Operators

### Comparison Operators
```javascript
// $eq (equals)
db.users.find({ age: { $eq: 30 } })
db.users.find({ age: 30 })  // Implicit $eq

// $ne (not equals)
db.users.find({ status: { $ne: "deleted" } })

// $gt, $gte, $lt, $lte
db.users.find({ age: { $gt: 18, $lte: 65 } })

// $in (in array)
db.users.find({ status: { $in: ["active", "pending"] } })

// $nin (not in array)
db.users.find({ status: { $nin: ["deleted", "banned"] } })
```

### Logical Operators
```javascript
// $and (implicit for multiple conditions)
db.users.find({ age: { $gte: 18 }, status: "active" })

// $and (explicit)
db.users.find({
  $and: [
    { age: { $gte: 18 } },
    { status: "active" }
  ]
})

// $or
db.users.find({
  $or: [
    { status: "active" },
    { verified: true }
  ]
})

// $not
db.users.find({ age: { $not: { $lt: 18 } } })

// $nor (not any condition)
db.users.find({
  $nor: [
    { status: "deleted" },
    { status: "banned" }
  ]
})
```

### Element Operators
```javascript
// $exists
db.users.find({ phoneNumber: { $exists: true } })
db.users.find({ deletedAt: { $exists: false } })

// $type
db.users.find({ age: { $type: "int" } })
db.users.find({ age: { $type: ["int", "double"] } })
```

### Array Operators
```javascript
// $all (contains all elements)
db.posts.find({ tags: { $all: ["mongodb", "database"] } })

// $elemMatch (array element matches all conditions)
db.products.find({
  reviews: {
    $elemMatch: { rating: { $gte: 4 }, verified: true }
  }
})

// $size (array length)
db.posts.find({ tags: { $size: 3 } })
```

### String Operators
```javascript
// $regex (regular expression)
db.users.find({ name: { $regex: /^A/i } })
db.users.find({ email: { $regex: "@example\\.com$" } })

// Text search (requires text index)
db.articles.find({ $text: { $search: "mongodb database" } })
```

## Update Operators

### Field Update Operators
```javascript
// $set (set field value)
db.users.updateOne(
  { _id: userId },
  { $set: { status: "active", updatedAt: new Date() } }
)

// $unset (remove field)
db.users.updateOne(
  { _id: userId },
  { $unset: { tempField: "" } }
)

// $rename (rename field)
db.users.updateMany(
  {},
  { $rename: { "oldName": "newName" } }
)

// $currentDate (set to current date)
db.users.updateOne(
  { _id: userId },
  { $currentDate: { lastModified: true } }
)
```

### Numeric Update Operators
```javascript
// $inc (increment)
db.posts.updateOne(
  { _id: postId },
  { $inc: { views: 1, likes: 5 } }
)

// $mul (multiply)
db.products.updateOne(
  { _id: productId },
  { $mul: { price: 1.1 } }  // 10% increase
)

// $min (update if new value is less)
db.scores.updateOne(
  { _id: scoreId },
  { $min: { lowestScore: 50 } }
)

// $max (update if new value is greater)
db.scores.updateOne(
  { _id: scoreId },
  { $max: { highestScore: 100 } }
)
```

### Array Update Operators
```javascript
// $push (add to array)
db.posts.updateOne(
  { _id: postId },
  { $push: { comments: { author: "Alice", text: "Great!" } } }
)

// $push with $each (multiple elements)
db.posts.updateOne(
  { _id: postId },
  { $push: { tags: { $each: ["mongodb", "database"] } } }
)

// $addToSet (add if not exists)
db.users.updateOne(
  { _id: userId },
  { $addToSet: { interests: "coding" } }
)

// $pull (remove matching elements)
db.users.updateOne(
  { _id: userId },
  { $pull: { tags: "deprecated" } }
)

// $pop (remove first/last element)
db.users.updateOne(
  { _id: userId },
  { $pop: { notifications: -1 } }  // -1: first, 1: last
)

// $ (update first matching array element)
db.posts.updateOne(
  { _id: postId, "comments.author": "Alice" },
  { $set: { "comments.$.text": "Updated comment" } }
)

// $[] (update all array elements)
db.posts.updateOne(
  { _id: postId },
  { $set: { "comments.$[].verified": true } }
)

// $[<identifier>] (filtered positional)
db.posts.updateOne(
  { _id: postId },
  { $set: { "comments.$[elem].flagged": true } },
  { arrayFilters: [{ "elem.rating": { $lt: 2 } }] }
)
```

## Atomic Operations

### findAndModify / findOneAndUpdate
```javascript
// Find and update (returns old document by default)
db.users.findOneAndUpdate(
  { email: "alice@example.com" },
  { $set: { status: "active" } }
)

// Return new document
db.users.findOneAndUpdate(
  { email: "alice@example.com" },
  { $set: { status: "active" } },
  { returnNewDocument: true }
)

// Upsert and return new
db.counters.findOneAndUpdate(
  { _id: "sequence" },
  { $inc: { value: 1 } },
  { upsert: true, returnNewDocument: true }
)
```

### findOneAndReplace
```javascript
// Find and replace entire document
db.users.findOneAndReplace(
  { _id: ObjectId("...") },
  { name: "Alice", email: "alice@example.com" },
  { returnNewDocument: true }
)
```

### findOneAndDelete
```javascript
// Find and delete (returns deleted document)
const deletedUser = db.users.findOneAndDelete(
  { email: "alice@example.com" }
)
```

## Bulk Operations

```javascript
// Ordered bulk write (stops on first error)
db.users.bulkWrite([
  { insertOne: { document: { name: "Alice" } } },
  { updateOne: {
    filter: { name: "Bob" },
    update: { $set: { age: 25 } }
  }},
  { deleteOne: { filter: { name: "Charlie" } } }
])

// Unordered (continues on errors)
db.users.bulkWrite(operations, { ordered: false })
```

## Best Practices

1. **Use projection** to return only needed fields
2. **Create indexes** on frequently queried fields
3. **Use updateMany** carefully (can affect many documents)
4. **Use upsert** for "create or update" patterns
5. **Use atomic operators** ($inc, $push) for concurrent updates
6. **Avoid large arrays** in documents (embed vs reference)
7. **Use findAndModify** for atomic read-modify-write
8. **Batch operations** with insertMany/bulkWrite for efficiency
