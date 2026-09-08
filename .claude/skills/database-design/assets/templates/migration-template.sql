-- Migration: YYYYMMDDHHMMSS_descriptive_name.sql
-- Description: [What this migration does]
-- Author: [Your Name]
-- Date: YYYY-MM-DD

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

BEGIN;

-- Step 1: Create table
CREATE TABLE IF NOT EXISTS table_name (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  column_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Step 2: Add indexes
CREATE INDEX idx_table_column ON table_name(column_name);

-- Step 3: Add foreign keys
ALTER TABLE table_name
  ADD CONSTRAINT fk_table_reference
  FOREIGN KEY (reference_id) REFERENCES other_table(id)
  ON DELETE CASCADE;

-- Step 4: Data migration (if needed)
-- UPDATE table_name SET new_column = old_column;

COMMIT;

-- ============================================================================
-- DOWN MIGRATION
-- ============================================================================

-- BEGIN;
-- ALTER TABLE table_name DROP FOREIGN KEY fk_table_reference;
-- DROP INDEX idx_table_column ON table_name;
-- DROP TABLE IF EXISTS table_name;
-- COMMIT;

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Check table exists:
-- SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'table_name';

-- Check indexes:
-- SHOW INDEX FROM table_name;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Estimated time: [X seconds on Y rows]
-- Requires downtime: [Yes/No]
-- Rollback tested: [Yes/No]
