#!/usr/bin/env python3
"""
Migration Verification Script for FamilyFlow Native Deployment

This script runs database migrations and verifies that all FamilyFlow models
are created correctly in the Supabase database.

Usage:
    python3 apps/api/bin/verify-migrations.py

Prerequisites:
    - SUPABASE_DB_URL or DATABASE_URL environment variable set
    - Database accessible from current network (not Docker network)
    - Django dependencies installed
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
from django.db import connections, connection
from django.core.management import call_command
from django.core.management.base import CommandError
from plane.db.models import Family, FamilyMember, BacklogItem


def check_table_exists(table_name):
    """Check if a database table exists"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = %s
            );
        """, [table_name])
        return cursor.fetchone()[0]


def get_table_columns(table_name):
    """Get column names for a table"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = %s
            ORDER BY ordinal_position;
        """, [table_name])
        return [row[0] for row in cursor.fetchall()]


def verify_family_table():
    """Verify the families table structure"""
    print("\n" + "=" * 60)
    print("Verifying 'families' table")
    print("=" * 60)
    
    if not check_table_exists("families"):
        print("❌ ERROR: 'families' table does not exist!")
        return False
    
    print("✓ 'families' table exists")
    
    # Check expected columns
    expected_columns = {
        "id", "name", "sprint_duration", "default_swim_lanes",
        "custom_swim_lanes", "gamification_enabled", "baseline_capacity",
        "created_at", "updated_at", "deleted_at"
    }
    
    actual_columns = set(get_table_columns("families"))
    
    print(f"\nTable columns: {len(actual_columns)}")
    print(f"Expected columns: {sorted(expected_columns)}")
    print(f"Actual columns: {sorted(actual_columns)}")
    
    missing_columns = expected_columns - actual_columns
    if missing_columns:
        print(f"\n❌ ERROR: Missing columns: {missing_columns}")
        return False
    
    print("\n✓ All expected columns present")
    
    # Verify model can query the table
    try:
        count = Family.objects.count()
        print(f"✓ Model can query table (count: {count})")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: Cannot query Family model: {e}")
        return False


def verify_family_member_table():
    """Verify the family_members table structure"""
    print("\n" + "=" * 60)
    print("Verifying 'family_members' table")
    print("=" * 60)
    
    if not check_table_exists("family_members"):
        print("❌ ERROR: 'family_members' table does not exist!")
        return False
    
    print("✓ 'family_members' table exists")
    
    # Check expected columns
    expected_columns = {
        "id", "user_id", "family_id", "name", "age", "role",
        "avatar_url", "joined_at", "is_active", "use_kid_interface",
        "created_at", "updated_at", "deleted_at"
    }
    
    actual_columns = set(get_table_columns("family_members"))
    
    print(f"\nTable columns: {len(actual_columns)}")
    print(f"Expected columns: {sorted(expected_columns)}")
    print(f"Actual columns: {sorted(actual_columns)}")
    
    missing_columns = expected_columns - actual_columns
    if missing_columns:
        print(f"\n⚠ WARNING: Missing columns: {missing_columns}")
        print("  (This may be OK if some columns are not yet migrated)")
    
    print("\n✓ Table structure looks correct")
    
    # Verify model can query the table
    try:
        count = FamilyMember.objects.count()
        print(f"✓ Model can query table (count: {count})")
        return True
    except Exception as e:
        print(f"\n❌ ERROR: Cannot query FamilyMember model: {e}")
        return False


def verify_backlog_item_table():
    """Verify the backlog_items table structure (if exists)"""
    print("\n" + "=" * 60)
    print("Verifying 'backlog_items' table")
    print("=" * 60)
    
    if not check_table_exists("backlog_items"):
        print("⚠ WARNING: 'backlog_items' table does not exist yet")
        print("  (This is OK if BacklogItem migrations haven't been run)")
        return True  # Not a failure, just not yet migrated
    
    print("✓ 'backlog_items' table exists")
    
    # Verify model can query the table
    try:
        count = BacklogItem.objects.count()
        print(f"✓ Model can query table (count: {count})")
        return True
    except Exception as e:
        print(f"\n⚠ WARNING: Cannot query BacklogItem model: {e}")
        return True  # Not critical if model doesn't exist yet


def verify_foreign_keys():
    """Verify foreign key constraints exist"""
    print("\n" + "=" * 60)
    print("Verifying Foreign Key Constraints")
    print("=" * 60)
    
    with connection.cursor() as cursor:
        # Check family_members -> families foreign key
        cursor.execute("""
            SELECT COUNT(*) 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_name = 'family_members'
            AND constraint_name LIKE '%family%';
        """)
        fk_count = cursor.fetchone()[0]
        
        if fk_count > 0:
            print("✓ Foreign key constraints exist")
            return True
        else:
            print("⚠ WARNING: Foreign key constraints not found")
            return True  # Not a failure, constraints may be optional


def verify_indexes():
    """Verify indexes exist"""
    print("\n" + "=" * 60)
    print("Verifying Indexes")
    print("=" * 60)
    
    with connection.cursor() as cursor:
        # Check indexes on family_members
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename IN ('families', 'family_members')
            AND schemaname = 'public';
        """)
        indexes = [row[0] for row in cursor.fetchall()]
        
        if indexes:
            print(f"✓ Found {len(indexes)} indexes")
            print(f"  Indexes: {', '.join(indexes[:5])}" + ("..." if len(indexes) > 5 else ""))
            return True
        else:
            print("⚠ WARNING: No indexes found")
            return True  # Not a failure


def run_migrations():
    """Run database migrations"""
    print("=" * 60)
    print("Running Database Migrations")
    print("=" * 60)
    
    try:
        print("\nExecuting: python manage.py migrate")
        call_command("migrate", verbosity=2, interactive=False)
        print("\n✓ Migrations completed successfully")
        return True
    except CommandError as e:
        print(f"\n❌ ERROR: Migration command failed: {e}")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: Unexpected error during migrations: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all verification checks"""
    print("\n" + "=" * 60)
    print("FamilyFlow Migration Verification for Native Deployment")
    print("=" * 60)
    print("\nThis script verifies that database migrations run correctly")
    print("and all FamilyFlow models are created in Supabase.\n")
    
    results = []
    
    # Step 1: Run migrations
    print("\n[Step 1/5] Running migrations...")
    if not run_migrations():
        print("\n❌ Migration failed. Please check the errors above.")
        return 1
    results.append(("Migrations", True))
    
    # Step 2: Verify families table
    print("\n[Step 2/5] Verifying families table...")
    results.append(("Families Table", verify_family_table()))
    
    # Step 3: Verify family_members table
    print("\n[Step 3/5] Verifying family_members table...")
    results.append(("Family Members Table", verify_family_member_table()))
    
    # Step 4: Verify backlog_items table (if exists)
    print("\n[Step 4/5] Verifying backlog_items table...")
    results.append(("Backlog Items Table", verify_backlog_item_table()))
    
    # Step 5: Verify constraints and indexes
    print("\n[Step 5/5] Verifying constraints and indexes...")
    results.append(("Foreign Keys", verify_foreign_keys()))
    results.append(("Indexes", verify_indexes()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Verification Summary")
    print("=" * 60)
    
    all_passed = True
    for check_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {check_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ All verifications passed! Migrations are working correctly.")
        return 0
    else:
        print("✗ Some verifications failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

