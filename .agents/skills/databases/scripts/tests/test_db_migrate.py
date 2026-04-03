"""Tests for db_migrate.py"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db_migrate import Migration, MigrationManager


@pytest.fixture
def temp_migrations_dir(tmp_path):
    """Create temporary migrations directory."""
    migrations_dir = tmp_path / "migrations"
    migrations_dir.mkdir()
    return str(migrations_dir)


@pytest.fixture
def mock_mongo_client():
    """Mock MongoDB client."""
    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_client.get_default_database.return_value = mock_db
    mock_client.server_info.return_value = {}
    return mock_client, mock_db


@pytest.fixture
def mock_postgres_conn():
    """Mock PostgreSQL connection."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    return mock_conn, mock_cursor


class TestMigration:
    """Test Migration dataclass."""

    def test_migration_creation(self):
        """Test creating migration object."""
        migration = Migration(
            id="20250101120000",
            name="test_migration",
            timestamp=datetime.now(),
            database_type="mongodb"
        )

        assert migration.id == "20250101120000"
        assert migration.name == "test_migration"
        assert migration.database_type == "mongodb"
        assert not migration.applied


class TestMigrationManager:
    """Test MigrationManager class."""

    def test_init(self, temp_migrations_dir):
        """Test manager initialization."""
        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)

        assert manager.db_type == "mongodb"
        assert manager.connection_string == "mongodb://localhost"
        assert Path(temp_migrations_dir).exists()

    @patch('db_migrate.MongoClient')
    def test_connect_mongodb(self, mock_client_class, temp_migrations_dir, mock_mongo_client):
        """Test MongoDB connection."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)
        result = manager.connect()

        assert result is True
        assert manager.client == mock_client
        assert manager.db == mock_db

    @patch('db_migrate.psycopg2')
    def test_connect_postgres(self, mock_psycopg2, temp_migrations_dir, mock_postgres_conn):
        """Test PostgreSQL connection."""
        mock_conn, mock_cursor = mock_postgres_conn
        mock_psycopg2.connect.return_value = mock_conn

        manager = MigrationManager("postgres", "postgresql://localhost", temp_migrations_dir)
        result = manager.connect()

        assert result is True
        assert manager.conn == mock_conn

    def test_connect_unsupported_db(self, temp_migrations_dir):
        """Test connection with unsupported database type."""
        manager = MigrationManager("unsupported", "connection_string", temp_migrations_dir)
        result = manager.connect()

        assert result is False

    def test_generate_migration(self, temp_migrations_dir):
        """Test migration generation."""
        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)
        migration = manager.generate_migration("test_migration")

        assert migration is not None
        assert migration.name == "test_migration"

        # Check file was created
        migration_files = list(Path(temp_migrations_dir).glob("*.json"))
        assert len(migration_files) == 1

        # Check file content
        with open(migration_files[0]) as f:
            data = json.load(f)
            assert data["name"] == "test_migration"
            assert data["database_type"] == "mongodb"

    def test_generate_migration_dry_run(self, temp_migrations_dir):
        """Test migration generation in dry-run mode."""
        manager = MigrationManager("postgres", "postgresql://localhost", temp_migrations_dir)
        migration = manager.generate_migration("test_migration", dry_run=True)

        assert migration is not None

        # Check no file was created
        migration_files = list(Path(temp_migrations_dir).glob("*.json"))
        assert len(migration_files) == 0

    def test_get_pending_migrations(self, temp_migrations_dir):
        """Test getting pending migrations."""
        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)

        # Create test migration file
        migration_data = {
            "id": "20250101120000",
            "name": "test_migration",
            "timestamp": datetime.now().isoformat(),
            "database_type": "mongodb",
            "mongodb_operations": []
        }

        migration_file = Path(temp_migrations_dir) / "20250101120000_test.json"
        with open(migration_file, "w") as f:
            json.dump(migration_data, f)

        # Mock database connection
        with patch.object(manager, 'db', MagicMock()):
            manager.db.migrations.find.return_value = []

            pending = manager.get_pending_migrations()

            assert len(pending) == 1
            assert pending[0].id == "20250101120000"
            assert pending[0].name == "test_migration"

    @patch('db_migrate.MongoClient')
    def test_apply_mongodb_migration(self, mock_client_class, temp_migrations_dir, mock_mongo_client):
        """Test applying MongoDB migration."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)
        manager.connect()

        migration = Migration(
            id="20250101120000",
            name="test_migration",
            timestamp=datetime.now(),
            database_type="mongodb",
            mongodb_operations=[
                {
                    "operation": "createIndex",
                    "collection": "users",
                    "index": {"email": 1},
                    "options": {}
                }
            ]
        )

        result = manager.apply_migration(migration)

        assert result is True
        mock_db["users"].create_index.assert_called_once()
        mock_db.migrations.insert_one.assert_called_once()

    def test_apply_migration_dry_run(self, temp_migrations_dir):
        """Test applying migration in dry-run mode."""
        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)

        migration = Migration(
            id="20250101120000",
            name="test_migration",
            timestamp=datetime.now(),
            database_type="mongodb",
            mongodb_operations=[]
        )

        result = manager.apply_migration(migration, dry_run=True)

        assert result is True

    @patch('db_migrate.psycopg2')
    def test_rollback_postgres_migration(self, mock_psycopg2, temp_migrations_dir, mock_postgres_conn):
        """Test rolling back PostgreSQL migration."""
        mock_conn, mock_cursor = mock_postgres_conn
        mock_psycopg2.connect.return_value = mock_conn

        manager = MigrationManager("postgres", "postgresql://localhost", temp_migrations_dir)
        manager.connect()

        # Create migration file
        migration_data = {
            "id": "20250101120000",
            "name": "test_migration",
            "timestamp": datetime.now().isoformat(),
            "database_type": "postgres",
            "up_sql": "CREATE TABLE test (id INT);",
            "down_sql": "DROP TABLE test;"
        }

        migration_file = Path(temp_migrations_dir) / "20250101120000_test.json"
        with open(migration_file, "w") as f:
            json.dump(migration_data, f)

        result = manager.rollback_migration("20250101120000")

        assert result is True
        # Verify SQL was executed
        assert mock_cursor.execute.call_count >= 1

    def test_rollback_migration_not_found(self, temp_migrations_dir):
        """Test rollback with non-existent migration."""
        manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)

        result = manager.rollback_migration("99999999999999")

        assert result is False


def test_migration_sorting(temp_migrations_dir):
    """Test that migrations are applied in correct order."""
    manager = MigrationManager("mongodb", "mongodb://localhost", temp_migrations_dir)

    # Create multiple migration files
    for i in range(3):
        migration_data = {
            "id": f"2025010112000{i}",
            "name": f"migration_{i}",
            "timestamp": datetime.now().isoformat(),
            "database_type": "mongodb",
            "mongodb_operations": []
        }

        migration_file = Path(temp_migrations_dir) / f"2025010112000{i}_test.json"
        with open(migration_file, "w") as f:
            json.dump(migration_data, f)

    with patch.object(manager, 'db', MagicMock()):
        manager.db.migrations.find.return_value = []

        pending = manager.get_pending_migrations()

        # Check they're in order
        assert len(pending) == 3
        assert pending[0].id == "20250101120000"
        assert pending[1].id == "20250101120001"
        assert pending[2].id == "20250101120002"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
