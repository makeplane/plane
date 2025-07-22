# API SERVER

## Read Replica Implementation

This API server includes a comprehensive read replica system for improved database performance and scalability.

### Documentation

- **[READ_REPLICA_ARCHITECTURE.md](./READ_REPLICA_ARCHITECTURE.md)** - Complete technical architecture documentation
- **[READ_REPLICA_SETUP.md](./READ_REPLICA_SETUP.md)** - Quick setup guide for developers
- **[READ_REPLICA_CHANGES.md](./READ_REPLICA_CHANGES.md)** - Summary of implementation changes

### Quick Overview

The read replica system automatically routes:
- **Read operations** (GET, HEAD, OPTIONS) → Read replica database (configurable)
- **Write operations** (POST, PUT, PATCH, DELETE) → Primary database (always)

All existing views automatically inherit read replica capability through the base view classes. No code changes required for basic functionality.

### Key Features

- ✅ Zero breaking changes to existing code
- ✅ Automatic routing based on HTTP methods
- ✅ Declarative control with `use_read_replica = True/False`
- ✅ Request-scoped context isolation for async safety
- ✅ Comprehensive logging and error handling
- ✅ Easy rollback capability

### Quick Setup

1. Configure replica database in settings
2. Set `ENABLE_READ_REPLICA=1`
3. Add middleware and router to Django settings
4. Views automatically use replicas for read operations

See [READ_REPLICA_SETUP.md](./READ_REPLICA_SETUP.md) for detailed setup instructions.