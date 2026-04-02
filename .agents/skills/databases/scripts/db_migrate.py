#!/usr/bin/env python3
"""
Database migration tool for MongoDB and PostgreSQL.
Generates and applies schema migrations with rollback support.
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Windows UTF-8 compatibility (works for both local and global installs)
CLAUDE_ROOT = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(CLAUDE_ROOT / 'scripts'))
try:
    from win_compat import ensure_utf8_stdout
    ensure_utf8_stdout()
except ImportError:
    if sys.platform == 'win32':
        import io
        if hasattr(sys.stdout, 'buffer'):
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

try:
    import psycopg2
    from psycopg2 import sql
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False


@dataclass
class Migration:
    """Represents a database migration."""

    id: str
    name: str
    timestamp: datetime
    database_type: str
    up_sql: Optional[str] = None
    down_sql: Optional[str] = None
    mongodb_operations: Optional[List[Dict[str, Any]]] = None
    applied: bool = False


class MigrationManager:
    """Manages database migrations for MongoDB and PostgreSQL."""

    def __init__(self, db_type: str, connection_string: str, migrations_dir: str = "./migrations"):
        """
        Initialize migration manager.

        Args:
            db_type: Database type ('mongodb' or 'postgres')
            connection_string: Database connection string
            migrations_dir: Directory to store migration files
        """
        self.db_type = db_type.lower()
        self.connection_string = connection_string
        self.migrations_dir = Path(migrations_dir)
        self.migrations_dir.mkdir(exist_ok=True)

        self.client = None
        self.db = None
        self.conn = None

    def connect(self) -> bool:
        """
        Connect to database.

        Returns:
            True if connection successful, False otherwise
        """
        try:
            if self.db_type == "mongodb":
                if not MONGO_AVAILABLE:
                    print("Error: pymongo not installed")
                    return False
                self.client = MongoClient(self.connection_string)
                self.db = self.client.get_default_database()
                # Test connection
                self.client.server_info()
                return True

            elif self.db_type == "postgres":
                if not POSTGRES_AVAILABLE:
                    print("Error: psycopg2 not installed")
                    return False
                self.conn = psycopg2.connect(self.connection_string)
                return True

            else:
                print(f"Error: Unsupported database type: {self.db_type}")
                return False

        except Exception as e:
            print(f"Connection error: {e}")
            return False

    def disconnect(self):
        """Disconnect from database."""
        try:
            if self.client:
                self.client.close()
            if self.conn:
                self.conn.close()
        except Exception as e:
            print(f"Disconnect error: {e}")

    def _ensure_migrations_table(self):
        """Create migrations tracking table/collection if not exists."""
        if self.db_type == "mongodb":
            # MongoDB creates collection automatically
            pass
        elif self.db_type == "postgres":
            with self.conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS migrations (
                        id VARCHAR(255) PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            self.conn.commit()

    def generate_migration(self, name: str, dry_run: bool = False) -> Optional[Migration]:
        """
        Generate new migration file.

        Args:
            name: Migration name
            dry_run: If True, only show what would be generated

        Returns:
            Migration object if successful, None otherwise
        """
        timestamp = datetime.now()
        migration_id = timestamp.strftime("%Y%m%d%H%M%S")
        filename = f"{migration_id}_{name}.json"
        filepath = self.migrations_dir / filename

        migration = Migration(
            id=migration_id,
            name=name,
            timestamp=timestamp,
            database_type=self.db_type
        )

        if self.db_type == "mongodb":
            migration.mongodb_operations = [
                {
                    "operation": "createIndex",
                    "collection": "example_collection",
                    "index": {"field": 1},
                    "options": {}
                }
            ]
        elif self.db_type == "postgres":
            migration.up_sql = "-- Add your SQL here\n"
            migration.down_sql = "-- Add rollback SQL here\n"

        migration_data = {
            "id": migration.id,
            "name": migration.name,
            "timestamp": migration.timestamp.isoformat(),
            "database_type": migration.database_type,
            "up_sql": migration.up_sql,
            "down_sql": migration.down_sql,
            "mongodb_operations": migration.mongodb_operations
        }

        if dry_run:
            print(f"Would create: {filepath}")
            print(json.dumps(migration_data, indent=2))
            return migration

        try:
            with open(filepath, "w") as f:
                json.dump(migration_data, f, indent=2)
            print(f"Created migration: {filepath}")
            return migration
        except Exception as e:
            print(f"Error creating migration: {e}")
            return None

    def get_pending_migrations(self) -> List[Migration]:
        """
        Get list of pending migrations.

        Returns:
            List of pending Migration objects
        """
        # Get applied migrations
        applied_ids = set()

        try:
            if self.db_type == "mongodb":
                applied_ids = {
                    doc["id"] for doc in self.db.migrations.find({}, {"id": 1})
                }
            elif self.db_type == "postgres":
                with self.conn.cursor() as cur:
                    cur.execute("SELECT id FROM migrations")
                    applied_ids = {row[0] for row in cur.fetchall()}
        except Exception as e:
            print(f"Error reading applied migrations: {e}")

        # Get all migration files
        pending = []
        for filepath in sorted(self.migrations_dir.glob("*.json")):
            try:
                with open(filepath) as f:
                    data = json.load(f)

                if data["id"] not in applied_ids:
                    migration = Migration(
                        id=data["id"],
                        name=data["name"],
                        timestamp=datetime.fromisoformat(data["timestamp"]),
                        database_type=data["database_type"],
                        up_sql=data.get("up_sql"),
                        down_sql=data.get("down_sql"),
                        mongodb_operations=data.get("mongodb_operations")
                    )
                    pending.append(migration)
            except Exception as e:
                print(f"Error reading {filepath}: {e}")

        return pending

    def apply_migration(self, migration: Migration, dry_run: bool = False) -> bool:
        """
        Apply migration.

        Args:
            migration: Migration to apply
            dry_run: If True, only show what would be executed

        Returns:
            True if successful, False otherwise
        """
        print(f"Applying migration: {migration.id} - {migration.name}")

        if dry_run:
            if self.db_type == "mongodb":
                print("MongoDB operations:")
                print(json.dumps(migration.mongodb_operations, indent=2))
            elif self.db_type == "postgres":
                print("SQL to execute:")
                print(migration.up_sql)
            return True

        try:
            if self.db_type == "mongodb":
                for op in migration.mongodb_operations or []:
                    if op["operation"] == "createIndex":
                        self.db[op["collection"]].create_index(
                            list(op["index"].items()),
                            **op.get("options", {})
                        )

                # Record migration
                self.db.migrations.insert_one({
                    "id": migration.id,
                    "name": migration.name,
                    "applied_at": datetime.now()
                })

            elif self.db_type == "postgres":
                with self.conn.cursor() as cur:
                    cur.execute(migration.up_sql)

                    # Record migration
                    cur.execute(
                        "INSERT INTO migrations (id, name) VALUES (%s, %s)",
                        (migration.id, migration.name)
                    )
                self.conn.commit()

            print(f"✓ Applied: {migration.id}")
            return True

        except Exception as e:
            print(f"✗ Error applying migration: {e}")
            if self.conn:
                self.conn.rollback()
            return False

    def rollback_migration(self, migration_id: str, dry_run: bool = False) -> bool:
        """
        Rollback migration.

        Args:
            migration_id: Migration ID to rollback
            dry_run: If True, only show what would be executed

        Returns:
            True if successful, False otherwise
        """
        # Find migration file
        migration_file = None
        for filepath in self.migrations_dir.glob(f"{migration_id}_*.json"):
            migration_file = filepath
            break

        if not migration_file:
            print(f"Migration not found: {migration_id}")
            return False

        try:
            with open(migration_file) as f:
                data = json.load(f)

            print(f"Rolling back: {migration_id} - {data['name']}")

            if dry_run:
                if self.db_type == "postgres":
                    print("SQL to execute:")
                    print(data.get("down_sql", "-- No rollback defined"))
                return True

            if self.db_type == "postgres" and data.get("down_sql"):
                with self.conn.cursor() as cur:
                    cur.execute(data["down_sql"])
                    cur.execute("DELETE FROM migrations WHERE id = %s", (migration_id,))
                self.conn.commit()
            elif self.db_type == "mongodb":
                self.db.migrations.delete_one({"id": migration_id})

            print(f"✓ Rolled back: {migration_id}")
            return True

        except Exception as e:
            print(f"✗ Error rolling back: {e}")
            if self.conn:
                self.conn.rollback()
            return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Database migration tool")
    parser.add_argument("--db", required=True, choices=["mongodb", "postgres"],
                       help="Database type")
    parser.add_argument("--uri", help="Database connection string")
    parser.add_argument("--migrations-dir", default="./migrations",
                       help="Migrations directory")

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate new migration")
    gen_parser.add_argument("name", help="Migration name")
    gen_parser.add_argument("--dry-run", action="store_true",
                           help="Show what would be generated")

    # Apply command
    apply_parser = subparsers.add_parser("apply", help="Apply pending migrations")
    apply_parser.add_argument("--dry-run", action="store_true",
                             help="Show what would be executed")

    # Rollback command
    rollback_parser = subparsers.add_parser("rollback", help="Rollback migration")
    rollback_parser.add_argument("id", help="Migration ID to rollback")
    rollback_parser.add_argument("--dry-run", action="store_true",
                                help="Show what would be executed")

    # Status command
    subparsers.add_parser("status", help="Show migration status")

    args = parser.parse_args()

    # For generate, we don't need connection
    if args.command == "generate":
        manager = MigrationManager(args.db, "", args.migrations_dir)
        migration = manager.generate_migration(args.name, args.dry_run)
        sys.exit(0 if migration else 1)

    # Other commands need connection
    if not args.uri:
        print("Error: --uri required for this command")
        sys.exit(1)

    manager = MigrationManager(args.db, args.uri, args.migrations_dir)

    if not manager.connect():
        sys.exit(1)

    try:
        manager._ensure_migrations_table()

        if args.command == "status":
            pending = manager.get_pending_migrations()
            print(f"Pending migrations: {len(pending)}")
            for migration in pending:
                print(f"  {migration.id} - {migration.name}")

        elif args.command == "apply":
            pending = manager.get_pending_migrations()
            if not pending:
                print("No pending migrations")
            else:
                for migration in pending:
                    if not manager.apply_migration(migration, args.dry_run):
                        sys.exit(1)

        elif args.command == "rollback":
            if not manager.rollback_migration(args.id, args.dry_run):
                sys.exit(1)

    finally:
        manager.disconnect()


if __name__ == "__main__":
    main()
