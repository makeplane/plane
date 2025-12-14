#!/usr/bin/env python3
"""
Test script to verify Supabase database connection in native deployment.

This script tests:
1. Environment variable loading
2. Connection string parsing
3. Database connectivity
4. SSL mode handling

Usage:
    python3 apps/api/bin/test-supabase-connection.py

Prerequisites:
    - SUPABASE_DB_URL or DATABASE_URL environment variable set
    - Database accessible from current network (not Docker network)
    - psycopg2 or psycopg installed
"""

import os
import sys
import django
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "apps" / "api"))

# Set Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.local")

# Setup Django
django.setup()

# Now import Django modules
from django.db import connections
from django.db.utils import OperationalError
from plane.settings.supabase import (
    SUPABASE_DB_URL,
    SUPABASE_PROJECT_REF,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
)
from plane.settings.common import DATABASES


def test_environment_variables():
    """Test that Supabase environment variables are loaded."""
    print("=" * 60)
    print("Testing Environment Variable Loading")
    print("=" * 60)
    
    results = {
        "SUPABASE_DB_URL": bool(SUPABASE_DB_URL),
        "SUPABASE_PROJECT_REF": bool(SUPABASE_PROJECT_REF),
        "SUPABASE_URL": bool(SUPABASE_URL),
        "SUPABASE_ANON_KEY": bool(SUPABASE_ANON_KEY),
        "SUPABASE_SERVICE_ROLE_KEY": bool(SUPABASE_SERVICE_ROLE_KEY),
    }
    
    # Check raw environment variables
    raw_env = {
        "SUPABASE_DB_URL": os.environ.get("SUPABASE_DB_URL"),
        "DATABASE_URL": os.environ.get("DATABASE_URL"),
        "SUPABASE_PROJECT_REF": os.environ.get("SUPABASE_PROJECT_REF"),
        "SUPABASE_URL": os.environ.get("SUPABASE_URL"),
        "SUPABASE_ANON_KEY": os.environ.get("SUPABASE_ANON_KEY"),
        "SUPABASE_SERVICE_ROLE_KEY": os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
    }
    
    print("\nRaw Environment Variables:")
    for key, value in raw_env.items():
        if value:
            # Mask password in connection strings
            if "PASSWORD" in key or "DB_URL" in key or "DATABASE_URL" in key:
                # Try to mask password in connection string
                masked = value
                if "@" in value:
                    parts = value.split("@")
                    if ":" in parts[0]:
                        user_pass = parts[0].split(":")
                        if len(user_pass) >= 3:  # postgres:password:port format
                            masked = f"{user_pass[0]}:****@{parts[1]}"
                        else:
                            masked = f"{user_pass[0]}:****@{parts[1]}"
                print(f"  {key}: {masked}")
            else:
                # Only show first 20 chars of keys
                display_value = value[:20] + "..." if len(value) > 20 else value
                print(f"  {key}: {display_value}")
        else:
            print(f"  {key}: (not set)")
    
    print("\nLoaded Configuration:")
    print(f"  SUPABASE_DB_URL: {'✓ Set' if results['SUPABASE_DB_URL'] else '✗ Not set'}")
    print(f"  SUPABASE_PROJECT_REF: {'✓ Set' if results['SUPABASE_PROJECT_REF'] else '✗ Not set (optional)'}")
    print(f"  SUPABASE_URL: {'✓ Set' if results['SUPABASE_URL'] else '✗ Not set (optional)'}")
    print(f"  SUPABASE_ANON_KEY: {'✓ Set' if results['SUPABASE_ANON_KEY'] else '✗ Not set (optional)'}")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {'✓ Set' if results['SUPABASE_SERVICE_ROLE_KEY'] else '✗ Not set (optional)'}")
    
    # At least DB URL must be set
    if not results['SUPABASE_DB_URL']:
        print("\n❌ ERROR: SUPABASE_DB_URL or DATABASE_URL must be set!")
        return False
    
    print("\n✓ Environment variables loaded successfully")
    return True


def test_connection_string_parsing():
    """Test that connection string is parsed correctly."""
    print("\n" + "=" * 60)
    print("Testing Connection String Parsing")
    print("=" * 60)
    
    try:
        db_config = DATABASES.get("default", {})
        
        print(f"\nDatabase Configuration:")
        print(f"  Engine: {db_config.get('ENGINE', 'N/A')}")
        print(f"  Name: {db_config.get('NAME', 'N/A')}")
        print(f"  User: {db_config.get('USER', 'N/A')}")
        print(f"  Host: {db_config.get('HOST', 'N/A')}")
        print(f"  Port: {db_config.get('PORT', 'N/A')}")
        print(f"  SSL Mode: {db_config.get('OPTIONS', {}).get('sslmode', 'N/A')}")
        
        # Check if connection string was parsed
        if db_config.get('ENGINE') and db_config.get('NAME'):
            print("\n✓ Connection string parsed successfully")
            return True
        else:
            print("\n❌ ERROR: Connection string not parsed correctly")
            return False
            
    except Exception as e:
        print(f"\n❌ ERROR: Failed to parse connection string: {e}")
        return False


def test_database_connection():
    """Test actual database connectivity."""
    print("\n" + "=" * 60)
    print("Testing Database Connection")
    print("=" * 60)
    
    try:
        # Get default database connection
        db_conn = connections["default"]
        
        # Try to connect
        print("\nAttempting to connect to database...")
        with db_conn.cursor() as cursor:
            # Test query
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            
            # Test current database
            cursor.execute("SELECT current_database();")
            db_name = cursor.fetchone()[0]
            
            # Test current user
            cursor.execute("SELECT current_user;")
            user = cursor.fetchone()[0]
            
            print(f"\n✓ Database connection successful!")
            print(f"  Database: {db_name}")
            print(f"  User: {user}")
            print(f"  PostgreSQL Version: {version[:50]}...")
            
            # Test if we can query a table (check if migrations have been run)
            try:
                cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;")
                tables = cursor.fetchall()
                if tables:
                    print(f"\n✓ Database tables found ({len(tables)} tables visible)")
                    print(f"  Sample tables: {', '.join([t[0] for t in tables[:3]])}")
                else:
                    print("\n⚠ WARNING: No tables found. Run migrations first.")
            except Exception as e:
                print(f"\n⚠ WARNING: Could not query tables: {e}")
            
            return True
            
    except OperationalError as e:
        print(f"\n❌ ERROR: Database connection failed!")
        print(f"  Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Verify SUPABASE_DB_URL is correct")
        print("  2. Check if database is accessible from this network")
        print("  3. Verify SSL mode is set correctly (sslmode=require)")
        print("  4. Check Supabase IP allowlist if connection is blocked")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_ssl_mode():
    """Test SSL mode configuration."""
    print("\n" + "=" * 60)
    print("Testing SSL Mode Configuration")
    print("=" * 60)
    
    try:
        db_config = DATABASES.get("default", {})
        options = db_config.get("OPTIONS", {})
        
        # Check SSL mode
        sslmode = options.get("sslmode", "prefer")
        
        print(f"\nSSL Mode: {sslmode}")
        
        if sslmode in ["require", "verify-ca", "verify-full"]:
            print("✓ SSL is enabled (required for Supabase)")
        elif sslmode == "prefer":
            print("⚠ SSL is preferred but not required")
        else:
            print("⚠ SSL is disabled - Supabase requires SSL!")
            print("  Add ?sslmode=require to your connection string")
        
        # Check if connection string has sslmode
        db_url = SUPABASE_DB_URL or os.environ.get("DATABASE_URL")
        if db_url and "sslmode=require" in db_url:
            print("✓ Connection string includes sslmode=require")
        elif db_url:
            print("⚠ Connection string does not explicitly set sslmode=require")
            print("  Recommended: Add ?sslmode=require to connection string")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to check SSL mode: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Supabase Connection Test for Native Deployment")
    print("=" * 60)
    print("\nThis script verifies that Supabase database connection works")
    print("in a native (non-Docker) deployment environment.\n")
    
    results = []
    
    # Run tests
    results.append(("Environment Variables", test_environment_variables()))
    results.append(("Connection String Parsing", test_connection_string_parsing()))
    results.append(("SSL Mode", test_ssl_mode()))
    results.append(("Database Connection", test_database_connection()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All tests passed! Supabase connection is configured correctly.")
        return 0
    else:
        print("✗ Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

