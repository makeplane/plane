# MongoDB Atlas Cloud Platform

MongoDB Atlas is fully-managed cloud database service with automated backups, monitoring, and scaling.

## Quick Start

### Create Free Cluster
1. Sign up at mongodb.com/atlas
2. Create organization and project
3. Build cluster (M0 Free Tier)
   - Cloud provider: AWS/GCP/Azure
   - Region: closest to users
   - Cluster name
4. Create database user (username/password)
5. Whitelist IP address (or 0.0.0.0/0 for development)
6. Get connection string

### Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Connect
```javascript
// Node.js
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://...";
const client = new MongoClient(uri);

await client.connect();
const db = client.db("myDatabase");
```

```python
# Python
from pymongo import MongoClient
uri = "mongodb+srv://..."
client = MongoClient(uri)
db = client.myDatabase
```

## Cluster Tiers

### M0 (Free Tier)
- 512 MB storage
- Shared CPU/RAM
- Perfect for development/learning
- Limited to 100 connections
- No backups

### M10+ (Dedicated Clusters)
- Dedicated resources
- 2GB - 4TB+ storage
- Automated backups
- Advanced monitoring
- Performance Advisor
- Multi-region support
- VPC peering

### Serverless
- Pay per operation
- Auto-scales to zero
- Good for sporadic workloads
- 1GB+ storage
- Limited features (no full-text search)

## Database Configuration

### Create Database
```javascript
// Via Atlas UI: Database → Add Database
// Via shell
use myNewDatabase
db.createCollection("myCollection")

// Via driver
const db = client.db("myNewDatabase");
await db.createCollection("myCollection");
```

### Schema Validation
```javascript
// Set validation rules in Atlas UI or via shell
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "name"],
      properties: {
        email: { bsonType: "string", pattern: "^.+@.+$" },
        age: { bsonType: "int", minimum: 0 }
      }
    }
  }
})
```

## Security

### Network Access
```javascript
// IP Whitelist (Atlas UI → Network Access)
// - Add IP Address: specific IPs
// - 0.0.0.0/0: allow from anywhere (dev only)
// - VPC Peering: private connection

// Connection string includes options
mongodb+srv://cluster.mongodb.net/?retryWrites=true&w=majority&ssl=true
```

### Database Users
```javascript
// Create via Atlas UI → Database Access
// - Username/password authentication
// - AWS IAM authentication
// - X.509 certificates

// Roles:
// - atlasAdmin: full access
// - readWriteAnyDatabase: read/write all databases
// - readAnyDatabase: read-only all databases
// - read/readWrite: database-specific
```

### Encryption
```javascript
// Encryption at rest (automatic on M10+)
// Encryption in transit (TLS/SSL, always enabled)

// Client-Side Field Level Encryption (CSFLE)
const autoEncryptionOpts = {
  keyVaultNamespace: "encryption.__keyVault",
  kmsProviders: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
};

const client = new MongoClient(uri, { autoEncryption: autoEncryptionOpts });
```

## Backups and Snapshots

### Cloud Backups (M10+)
```javascript
// Automatic continuous backups
// - Snapshots every 6-24 hours
// - Oplog for point-in-time recovery
// - Retention: 2+ days configurable

// Restore via Atlas UI:
// 1. Clusters → cluster name → Backup tab
// 2. Select snapshot or point in time
// 3. Download or restore to cluster
```

### Manual Backups
```bash
# Export using mongodump
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/mydb" --out=/backup

# Restore using mongorestore
mongorestore --uri="mongodb+srv://..." /backup/mydb
```

## Monitoring and Alerts

### Metrics Dashboard
```javascript
// Atlas UI → Metrics
// Key metrics:
// - Operations per second
// - Query execution times
// - Connections
// - Network I/O
// - Disk usage
// - CPU utilization

// Real-time Performance panel
// - Current operations
// - Slow queries
// - Index suggestions
```

### Alerts
```javascript
// Configure via Atlas UI → Alerts
// Alert types:
// - High connections (> threshold)
// - High CPU usage (> 80%)
// - Disk usage (> 90%)
// - Replication lag
// - Backup failures

// Notification channels:
// - Email
// - SMS
// - Slack
// - PagerDuty
// - Webhook
```

### Performance Advisor
```javascript
// Automatic index recommendations
// Atlas UI → Performance Advisor

// Analyzes:
// - Slow queries
// - Missing indexes
// - Redundant indexes
// - Index usage statistics

// Provides:
// - Index creation commands
// - Expected performance improvement
// - Schema design suggestions
```

## Atlas Search (Full-Text Search)

### Create Search Index
```javascript
// Atlas UI → Search → Create Index

// JSON definition
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      },
      "description": {
        "type": "string",
        "analyzer": "lucene.english"
      },
      "tags": {
        "type": "string"
      }
    }
  }
}
```

### Search Queries
```javascript
// Aggregation pipeline with $search
db.articles.aggregate([
  {
    $search: {
      text: {
        query: "mongodb database tutorial",
        path: ["title", "description"],
        fuzzy: { maxEdits: 1 }
      }
    }
  },
  { $limit: 10 },
  {
    $project: {
      title: 1,
      description: 1,
      score: { $meta: "searchScore" }
    }
  }
])

// Autocomplete
db.articles.aggregate([
  {
    $search: {
      autocomplete: {
        query: "mong",
        path: "title",
        tokenOrder: "sequential"
      }
    }
  }
])
```

## Atlas Vector Search (AI/ML)

### Create Vector Search Index
```javascript
// For AI similarity search (embeddings)
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,  // OpenAI embeddings
      "similarity": "cosine"
    }
  ]
}
```

### Vector Search Query
```javascript
// Search by similarity
db.products.aggregate([
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.123, 0.456, ...],  // 1536 dimensions
      numCandidates: 100,
      limit: 10
    }
  },
  {
    $project: {
      name: 1,
      description: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
])
```

## Data Federation

### Query Across Sources
```javascript
// Federated database instance
// Query data from:
// - Atlas clusters
// - AWS S3
// - HTTP endpoints

// Create virtual collection
{
  "databases": [{
    "name": "federated",
    "collections": [{
      "name": "sales",
      "dataSources": [{
        "storeName": "s3Store",
        "path": "/sales/*.json"
      }]
    }]
  }]
}

// Query like normal collection
use federated
db.sales.find({ region: "US" })
```

## Atlas Charts (Embedded Analytics)

### Create Dashboard
```javascript
// Atlas UI → Charts → New Dashboard
// Data source: Atlas cluster
// Chart types: bar, line, pie, scatter, etc.

// Embed in application
<iframe
  src="https://charts.mongodb.com/charts-project/embed/charts?id=..."
  width="800"
  height="600"
/>
```

## Atlas CLI

```bash
# Install
npm install -g mongodb-atlas-cli

# Login
atlas auth login

# List clusters
atlas clusters list

# Create cluster
atlas clusters create myCluster --provider AWS --region US_EAST_1 --tier M10

# Manage users
atlas dbusers create --username myuser --password mypass

# Backups
atlas backups snapshots list --clusterName myCluster
```

## Best Practices

1. **Use connection pooling** - Reuse connections
```javascript
const client = new MongoClient(uri, {
  maxPoolSize: 50,
  minPoolSize: 10
});
```

2. **Enable authentication** - Always use database users, not Atlas users

3. **Restrict network access** - IP whitelist or VPC peering

4. **Monitor regularly** - Set up alerts for key metrics

5. **Index optimization** - Use Performance Advisor recommendations

6. **Backup verification** - Regularly test restores

7. **Right-size clusters** - Start small, scale as needed

8. **Multi-region** - For global applications (M10+)

9. **Read preferences** - Use secondaries for read-heavy workloads
```javascript
const client = new MongoClient(uri, {
  readPreference: "secondaryPreferred"
});
```

10. **Connection string security** - Use environment variables
```javascript
const uri = process.env.MONGODB_URI;
```

## Troubleshooting

### Connection Issues
```javascript
// Check IP whitelist
// Verify credentials
// Test connection string

// Verbose logging
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
  loggerLevel: "debug"
});
```

### Performance Issues
```javascript
// Check Performance Advisor
// Review slow query logs
// Analyze index usage
db.collection.aggregate([{ $indexStats: {} }])

// Check connection count
db.serverStatus().connections
```

### Common Errors
```javascript
// MongoNetworkError: IP not whitelisted
// → Add IP to Network Access

// Authentication failed: wrong credentials
// → Verify username/password in Database Access

// Timeout: connection string or network issue
// → Check connection string format, DNS resolution
```
