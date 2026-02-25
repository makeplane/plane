"""Tests for db_backup.py"""

import json
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock, call

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db_backup import BackupInfo, BackupManager


@pytest.fixture
def temp_backup_dir(tmp_path):
    """Create temporary backup directory."""
    backup_dir = tmp_path / "backups"
    backup_dir.mkdir()
    return str(backup_dir)


@pytest.fixture
def sample_backup_info():
    """Create sample backup info."""
    return BackupInfo(
        filename="test_backup_20250101_120000.dump",
        database_type="mongodb",
        database_name="testdb",
        timestamp=datetime.now(),
        size_bytes=1024000,
        compressed=True,
        verified=True
    )


class TestBackupInfo:
    """Test BackupInfo dataclass."""

    def test_backup_info_creation(self):
        """Test creating backup info object."""
        info = BackupInfo(
            filename="backup.dump",
            database_type="mongodb",
            database_name="mydb",
            timestamp=datetime.now(),
            size_bytes=1024,
            compressed=False
        )

        assert info.filename == "backup.dump"
        assert info.database_type == "mongodb"
        assert info.database_name == "mydb"
        assert info.size_bytes == 1024
        assert not info.compressed
        assert not info.verified


class TestBackupManager:
    """Test BackupManager class."""

    def test_init(self, temp_backup_dir):
        """Test manager initialization."""
        manager = BackupManager("mongodb", temp_backup_dir)

        assert manager.db_type == "mongodb"
        assert Path(temp_backup_dir).exists()

    @patch('subprocess.run')
    def test_backup_mongodb(self, mock_run, temp_backup_dir):
        """Test MongoDB backup creation."""
        mock_run.return_value = Mock(returncode=0, stderr="")

        manager = BackupManager("mongodb", temp_backup_dir)
        backup_info = manager.create_backup(
            "mongodb://localhost",
            "testdb",
            compress=False,
            verify=False
        )

        assert backup_info is not None
        assert backup_info.database_type == "mongodb"
        assert backup_info.database_name == "testdb"
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_backup_postgres(self, mock_run, temp_backup_dir):
        """Test PostgreSQL backup creation."""
        mock_run.return_value = Mock(returncode=0, stderr="")

        manager = BackupManager("postgres", temp_backup_dir)

        with patch('builtins.open', create=True) as mock_open:
            mock_open.return_value.__enter__.return_value = MagicMock()

            backup_info = manager.create_backup(
                "postgresql://localhost/testdb",
                "testdb",
                compress=False,
                verify=False
            )

            assert backup_info is not None
            assert backup_info.database_type == "postgres"
            assert backup_info.database_name == "testdb"

    def test_backup_postgres_no_database(self, temp_backup_dir):
        """Test PostgreSQL backup without database name."""
        manager = BackupManager("postgres", temp_backup_dir)
        backup_info = manager.create_backup(
            "postgresql://localhost",
            database=None,
            compress=False,
            verify=False
        )

        assert backup_info is None

    @patch('subprocess.run')
    def test_backup_with_compression(self, mock_run, temp_backup_dir):
        """Test backup with compression."""
        mock_run.return_value = Mock(returncode=0, stderr="")

        manager = BackupManager("mongodb", temp_backup_dir)

        with patch('shutil.make_archive') as mock_archive, \
             patch('shutil.rmtree') as mock_rmtree:

            backup_info = manager.create_backup(
                "mongodb://localhost",
                "testdb",
                compress=True,
                verify=False
            )

            assert backup_info is not None
            assert backup_info.compressed
            mock_archive.assert_called_once()

    def test_save_and_load_metadata(self, temp_backup_dir, sample_backup_info):
        """Test saving and loading backup metadata."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Save metadata
        manager._save_metadata(sample_backup_info)

        # Check file was created
        metadata_file = Path(temp_backup_dir) / f"{sample_backup_info.filename}.json"
        assert metadata_file.exists()

        # Load metadata
        with open(metadata_file) as f:
            data = json.load(f)
            assert data["filename"] == sample_backup_info.filename
            assert data["database_type"] == "mongodb"
            assert data["database_name"] == "testdb"

    def test_list_backups(self, temp_backup_dir, sample_backup_info):
        """Test listing backups."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create test backup metadata
        manager._save_metadata(sample_backup_info)

        # List backups
        backups = manager.list_backups()

        assert len(backups) == 1
        assert backups[0].filename == sample_backup_info.filename
        assert backups[0].database_name == "testdb"

    @patch('subprocess.run')
    def test_restore_mongodb(self, mock_run, temp_backup_dir):
        """Test MongoDB restore."""
        mock_run.return_value = Mock(returncode=0, stderr="")

        manager = BackupManager("mongodb", temp_backup_dir)

        # Create dummy backup file
        backup_file = Path(temp_backup_dir) / "test_backup.dump"
        backup_file.touch()

        result = manager.restore_backup(
            "test_backup.dump",
            "mongodb://localhost"
        )

        assert result is True
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_restore_postgres(self, mock_run, temp_backup_dir):
        """Test PostgreSQL restore."""
        mock_run.return_value = Mock(returncode=0, stderr="")

        manager = BackupManager("postgres", temp_backup_dir)

        # Create dummy backup file
        backup_file = Path(temp_backup_dir) / "test_backup.sql"
        backup_file.write_text("SELECT 1;")

        with patch('builtins.open', create=True) as mock_open:
            mock_open.return_value.__enter__.return_value = MagicMock()

            result = manager.restore_backup(
                "test_backup.sql",
                "postgresql://localhost/testdb"
            )

            assert result is True

    def test_restore_nonexistent_backup(self, temp_backup_dir):
        """Test restore with non-existent backup file."""
        manager = BackupManager("mongodb", temp_backup_dir)

        result = manager.restore_backup(
            "nonexistent.dump",
            "mongodb://localhost"
        )

        assert result is False

    def test_restore_dry_run(self, temp_backup_dir):
        """Test restore in dry-run mode."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create dummy backup file
        backup_file = Path(temp_backup_dir) / "test_backup.dump"
        backup_file.touch()

        result = manager.restore_backup(
            "test_backup.dump",
            "mongodb://localhost",
            dry_run=True
        )

        assert result is True

    def test_cleanup_old_backups(self, temp_backup_dir):
        """Test cleaning up old backups."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create old backup file (simulate by setting mtime)
        old_backup = Path(temp_backup_dir) / "old_backup.dump"
        old_backup.touch()

        # Set mtime to 10 days ago
        old_time = datetime.now().timestamp() - (10 * 24 * 3600)
        os.utime(old_backup, (old_time, old_time))

        # Cleanup with 7-day retention
        removed = manager.cleanup_old_backups(retention_days=7)

        assert removed == 1
        assert not old_backup.exists()

    def test_cleanup_dry_run(self, temp_backup_dir):
        """Test cleanup in dry-run mode."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create old backup file
        old_backup = Path(temp_backup_dir) / "old_backup.dump"
        old_backup.touch()

        old_time = datetime.now().timestamp() - (10 * 24 * 3600)
        os.utime(old_backup, (old_time, old_time))

        # Cleanup with dry-run
        removed = manager.cleanup_old_backups(retention_days=7, dry_run=True)

        assert removed == 1
        assert old_backup.exists()  # File should still exist

    def test_verify_backup(self, temp_backup_dir, sample_backup_info):
        """Test backup verification."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create dummy backup file
        backup_file = Path(temp_backup_dir) / sample_backup_info.filename
        backup_file.write_text("backup data")

        result = manager._verify_backup(sample_backup_info)

        assert result is True

    def test_verify_empty_backup(self, temp_backup_dir, sample_backup_info):
        """Test verification of empty backup file."""
        manager = BackupManager("mongodb", temp_backup_dir)

        # Create empty backup file
        backup_file = Path(temp_backup_dir) / sample_backup_info.filename
        backup_file.touch()

        result = manager._verify_backup(sample_backup_info)

        assert result is False

    def test_format_size(self, temp_backup_dir):
        """Test size formatting."""
        manager = BackupManager("mongodb", temp_backup_dir)

        assert manager._format_size(500) == "500.00 B"
        assert manager._format_size(1024) == "1.00 KB"
        assert manager._format_size(1024 * 1024) == "1.00 MB"
        assert manager._format_size(1024 * 1024 * 1024) == "1.00 GB"

    def test_get_size_file(self, temp_backup_dir):
        """Test getting size of file."""
        manager = BackupManager("mongodb", temp_backup_dir)

        test_file = Path(temp_backup_dir) / "test.txt"
        test_file.write_text("test data")

        size = manager._get_size(test_file)

        assert size > 0

    def test_get_size_directory(self, temp_backup_dir):
        """Test getting size of directory."""
        manager = BackupManager("mongodb", temp_backup_dir)

        test_dir = Path(temp_backup_dir) / "test_dir"
        test_dir.mkdir()
        (test_dir / "file1.txt").write_text("data1")
        (test_dir / "file2.txt").write_text("data2")

        size = manager._get_size(test_dir)

        assert size > 0


# Import os for cleanup test
import os


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
