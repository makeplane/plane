# Database Schema Design Checklist

Complete checklist for designing and reviewing database schemas.

---

## Pre-Design

- [ ] **Requirements Gathered**: Understand data entities and relationships
- [ ] **Access Patterns Identified**: Know how data will be queried
- [ ] **SQL vs NoSQL Decision**: Chosen appropriate database type
- [ ] **Scale Estimate**: Expected data volume and growth rate
- [ ] **Read/Write Ratio**: Understand if read-heavy or write-heavy

---

## Normalization (SQL)

- [ ] **1NF**: Atomic values, no repeating groups
- [ ] **2NF**: No partial dependencies on composite keys
- [ ] **3NF**: No transitive dependencies
- [ ] **Denormalization Justified**: If denormalized, reason documented

---

## Table Design

### Primary Keys

- [ ] **Primary Key Defined**: Every table has primary key
- [ ] **Key Type Chosen**: INT auto-increment or UUID
- [ ] **Meaningful Keys Avoided**: Not using email/username as PK

### Data Types

- [ ] **Appropriate Types**: Correct data types for each column
- [ ] **String Sizes**: VARCHAR sized appropriately
- [ ] **Numeric Precision**: DECIMAL for money, INT for counts
- [ ] **Dates in UTC**: TIMESTAMP for datetime columns

### Constraints

- [ ] **NOT NULL**: Required columns marked NOT NULL
- [ ] **Unique Constraints**: Unique columns (email, username)
- [ ] **Check Constraints**: Validation rules (price >= 0)
- [ ] **Default Values**: Sensible defaults where appropriate

---

## Relationships

### Foreign Keys

- [ ] **Foreign Keys Defined**: All relationships have FK constraints
- [ ] **ON DELETE Strategy**: CASCADE, RESTRICT, SET NULL chosen
- [ ] **ON UPDATE Strategy**: Usually CASCADE
- [ ] **Indexes on Foreign Keys**: All FKs are indexed

### Relationship Types

- [ ] **One-to-Many**: Modeled correctly
- [ ] **Many-to-Many**: Junction table created
- [ ] **Self-Referencing**: Parent-child relationships handled
- [ ] **Polymorphic**: Strategy chosen (separate FKs or type+id)

---

## Indexing

### Index Strategy

- [ ] **Primary Key Indexed**: Automatic, verify
- [ ] **Foreign Keys Indexed**: All FKs have indexes
- [ ] **WHERE Columns**: Columns in WHERE clauses indexed
- [ ] **ORDER BY Columns**: Sort columns indexed
- [ ] **Composite Indexes**: Multi-column queries optimized
- [ ] **Column Order**: Most selective column first

### Index Limits

- [ ] **Not Over-Indexed**: Only necessary indexes
- [ ] **Index Maintenance**: Aware of write impact

---

## Performance

- [ ] **Joins Optimized**: N+1 queries avoided
- [ ] **SELECT * Avoided**: Only fetch needed columns
- [ ] **Pagination**: LIMIT/OFFSET or cursor-based
- [ ] **Aggregations**: Pre-calculated for expensive queries

---

## Migrations

- [ ] **Backward Compatible**: New columns nullable initially
- [ ] **Up and Down**: Rollback scripts provided
- [ ] **Data Migrations Separate**: Schema vs data separated
- [ ] **Tested on Staging**: Migrations tested

---

## Security

- [ ] **Least Privilege**: Minimal database permissions
- [ ] **Separate Accounts**: Read-only vs read-write
- [ ] **Sensitive Data**: Passwords hashed, PII encrypted
- [ ] **Parameterized Queries**: SQL injection prevented

---

## Documentation

- [ ] **ERD Created**: Entity-relationship diagram
- [ ] **Schema Documented**: Column descriptions
- [ ] **Indexes Documented**: Why each index exists
- [ ] **Migration History**: Changelog of changes
