"""Supabase-specific database configuration settings.

This module provides Supabase-specific database configuration.
Supabase uses PostgreSQL, so Django ORM works directly with it.
The primary difference is connection string format and optional RLS policies.
"""

import os

# Supabase connection URL format:
# postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
# Or use the connection pooling URL:
# postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true

# Supabase database URL from environment
# This works in any deployment environment (native, Docker, Railway, etc.)
# Priority: SUPABASE_DB_URL > DATABASE_URL
# For native deployment and local development, use SUPABASE_DB_URL
# Some platforms (Railway, Heroku) automatically provide DATABASE_URL
SUPABASE_DB_URL = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")

# Supabase project reference (for RLS policies and realtime subscriptions)
SUPABASE_PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF")
SUPABASE_URL = os.environ.get("SUPABASE_URL")  # e.g., https://xxx.supabase.co
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Enable Supabase Realtime subscriptions for real-time updates
# This is used by the frontend for task state updates
ENABLE_SUPABASE_REALTIME = os.environ.get("ENABLE_SUPABASE_REALTIME", "0") == "1"

# Supabase Row Level Security (RLS) is enabled at the database level
# RLS policies are managed via SQL migrations or Supabase dashboard
# This flag indicates whether RLS is enabled (should be True in production)
SUPABASE_RLS_ENABLED = os.environ.get("SUPABASE_RLS_ENABLED", "1") == "1"

