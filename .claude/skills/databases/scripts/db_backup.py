#!/usr/bin/env python3
"""
Database backup and restore tool for MongoDB and PostgreSQL.
Supports compression, scheduling, and verification.
"""

import argparse
import gzip
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class BackupInfo:
    """Backup metadata."""

    filename: str
    database_type: str
    database_name: str
    timestamp: datetime
    size_bytes: int
    compressed: bool
    verified: bool = False


class BackupManager:
    """Manages database backups for MongoDB and PostgreSQL."""

    def __init__(self, db_type: str, backup_dir: str = "./backups"):
        """
        Initialize backup manager.

        Args:
            db_type: Database type ('mongodb' or 'postgres')
            backup_dir: Directory to store backups
        """
        self.db_type = db_type.lower()
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(
        self,
        uri: str,
        database: Optional[str] = None,
        compress: bool = True,
        verify: bool = True
    ) -> Optional[BackupInfo]:
        """
        Create database backup.

        Args:
            uri: Database connection string
            database: Database name (optional for MongoDB)
            compress: Compress backup file
            verify: Verify backup after creation

        Returns:
            BackupInfo if successful, None otherwise
        """
        timestamp = datetime.now()
        date_str = timestamp.strftime("%Y%m%d_%H%M%S")

        if self.db_type == "mongodb":
            return self._backup_mongodb(uri, database, date_str, compress, verify)
        elif self.db_type == "postgres":
            return self._backup_postgres(uri, database, date_str, compress, verify)
        else:
            print(f"Error: Unsupported database type: {self.db_type}")
            return None

    def _backup_mongodb(
        self,
        uri: str,
        database: Optional[str],
        date_str: str,
        compress: bool,
        verify: bool
    ) -> Optional[BackupInfo]:
        """Create MongoDB backup using mongodump."""
        db_name = database or "all"
        filename = f"mongodb_{db_name}_{date_str}"
        backup_path = self.backup_dir / filename

        try:
            cmd = ["mongodump", "--uri", uri, "--out", str(backup_path)]

            if database:
                cmd.extend(["--db", database])

            print(f"Creating MongoDB backup: {filename}")
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                print(f"Error: {result.stderr}")
                return None

            # Compress if requested
            if compress:
                archive_path = backup_path.with_suffix(".tar.gz")
                print(f"Compressing backup...")
                shutil.make_archive(str(backup_path), "gztar", backup_path)
                shutil.rmtree(backup_path)
                backup_path = archive_path
                filename = archive_path.name

            size_bytes = self._get_size(backup_path)

            backup_info = BackupInfo(
                filename=filename,
                database_type="mongodb",
                database_name=db_name,
                timestamp=datetime.now(),
                size_bytes=size_bytes,
                compressed=compress
            )

            if verify:
                backup_info.verified = self._verify_backup(backup_info)

            self._save_metadata(backup_info)
            print(f"✓ Backup created: {filename} ({self._format_size(size_bytes)})")

            return backup_info

        except Exception as e:
            print(f"Error creating MongoDB backup: {e}")
            return None

    def _backup_postgres(
        self,
        uri: str,
        database: str,
        date_str: str,
        compress: bool,
        verify: bool
    ) -> Optional[BackupInfo]:
        """Create PostgreSQL backup using pg_dump."""
        if not database:
            print("Error: Database name required for PostgreSQL backup")
            return None

        ext = ".sql.gz" if compress else ".sql"
        filename = f"postgres_{database}_{date_str}{ext}"
        backup_path = self.backup_dir / filename

        try:
            cmd = ["pg_dump", uri]

            if compress:
                # Use pg_dump with gzip
                with open(backup_path, "wb") as f:
                    dump_proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
                    gzip_proc = subprocess.Popen(
                        ["gzip"],
                        stdin=dump_proc.stdout,
                        stdout=f
                    )
                    dump_proc.stdout.close()
                    gzip_proc.communicate()

                    if dump_proc.returncode != 0:
                        print("Error: pg_dump failed")
                        return None
            else:
                with open(backup_path, "w") as f:
                    result = subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, text=True)

                    if result.returncode != 0:
                        print(f"Error: {result.stderr}")
                        return None

            size_bytes = backup_path.stat().st_size

            backup_info = BackupInfo(
                filename=filename,
                database_type="postgres",
                database_name=database,
                timestamp=datetime.now(),
                size_bytes=size_bytes,
                compressed=compress
            )

            if verify:
                backup_info.verified = self._verify_backup(backup_info)

            self._save_metadata(backup_info)
            print(f"✓ Backup created: {filename} ({self._format_size(size_bytes)})")

            return backup_info

        except Exception as e:
            print(f"Error creating PostgreSQL backup: {e}")
            return None

    def restore_backup(self, filename: str, uri: str, dry_run: bool = False) -> bool:
        """
        Restore database from backup.

        Args:
            filename: Backup filename
            uri: Database connection string
            dry_run: If True, only show what would be done

        Returns:
            True if successful, False otherwise
        """
        backup_path = self.backup_dir / filename

        if not backup_path.exists():
            print(f"Error: Backup not found: {filename}")
            return False

        # Load metadata
        metadata_path = backup_path.with_suffix(".json")
        if metadata_path.exists():
            with open(metadata_path) as f:
                metadata = json.load(f)
                print(f"Restoring backup from {metadata['timestamp']}")
                print(f"Database: {metadata['database_name']}")

        if dry_run:
            print(f"Would restore from: {backup_path}")
            return True

        print(f"Restoring backup: {filename}")

        try:
            if self.db_type == "mongodb":
                return self._restore_mongodb(backup_path, uri)
            elif self.db_type == "postgres":
                return self._restore_postgres(backup_path, uri)
            else:
                print(f"Error: Unsupported database type: {self.db_type}")
                return False

        except Exception as e:
            print(f"Error restoring backup: {e}")
            return False

    def _restore_mongodb(self, backup_path: Path, uri: str) -> bool:
        """Restore MongoDB backup using mongorestore."""
        try:
            # Extract if compressed
            restore_path = backup_path
            if backup_path.suffix == ".gz":
                print("Extracting backup...")
                extract_path = backup_path.with_suffix("")
                shutil.unpack_archive(backup_path, extract_path)
                restore_path = extract_path

            cmd = ["mongorestore", "--uri", uri, str(restore_path)]

            result = subprocess.run(cmd, capture_output=True, text=True)

            # Cleanup extracted files
            if restore_path != backup_path and restore_path.is_dir():
                shutil.rmtree(restore_path)

            if result.returncode != 0:
                print(f"Error: {result.stderr}")
                return False

            print("✓ Restore completed")
            return True

        except Exception as e:
            print(f"Error restoring MongoDB: {e}")
            return False

    def _restore_postgres(self, backup_path: Path, uri: str) -> bool:
        """Restore PostgreSQL backup using psql."""
        try:
            if backup_path.suffix == ".gz":
                # Decompress and restore
                with gzip.open(backup_path, "rb") as f:
                    cmd = ["psql", uri]
                    result = subprocess.run(
                        cmd,
                        stdin=f,
                        capture_output=True,
                        text=False
                    )
            else:
                with open(backup_path) as f:
                    cmd = ["psql", uri]
                    result = subprocess.run(
                        cmd,
                        stdin=f,
                        capture_output=True,
                        text=True
                    )

            if result.returncode != 0:
                print(f"Error: {result.stderr}")
                return False

            print("✓ Restore completed")
            return True

        except Exception as e:
            print(f"Error restoring PostgreSQL: {e}")
            return False

    def list_backups(self) -> List[BackupInfo]:
        """
        List all backups.

        Returns:
            List of BackupInfo objects
        """
        backups = []

        for metadata_file in sorted(self.backup_dir.glob("*.json")):
            try:
                with open(metadata_file) as f:
                    data = json.load(f)

                backup_info = BackupInfo(
                    filename=data["filename"],
                    database_type=data["database_type"],
                    database_name=data["database_name"],
                    timestamp=datetime.fromisoformat(data["timestamp"]),
                    size_bytes=data["size_bytes"],
                    compressed=data["compressed"],
                    verified=data.get("verified", False)
                )
                backups.append(backup_info)
            except Exception as e:
                print(f"Error reading metadata {metadata_file}: {e}")

        return backups

    def cleanup_old_backups(self, retention_days: int, dry_run: bool = False) -> int:
        """
        Remove backups older than retention period.

        Args:
            retention_days: Number of days to retain backups
            dry_run: If True, only show what would be deleted

        Returns:
            Number of backups removed
        """
        cutoff = datetime.now().timestamp() - (retention_days * 24 * 3600)
        removed = 0

        for backup_file in self.backup_dir.glob("*"):
            if backup_file.suffix == ".json":
                continue

            if backup_file.stat().st_mtime < cutoff:
                if dry_run:
                    print(f"Would remove: {backup_file.name}")
                else:
                    print(f"Removing: {backup_file.name}")
                    backup_file.unlink()
                    # Remove metadata
                    metadata_file = backup_file.with_suffix(".json")
                    if metadata_file.exists():
                        metadata_file.unlink()
                removed += 1

        return removed

    def _verify_backup(self, backup_info: BackupInfo) -> bool:
        """
        Verify backup integrity.

        Args:
            backup_info: Backup information

        Returns:
            True if backup is valid, False otherwise
        """
        backup_path = self.backup_dir / backup_info.filename

        if not backup_path.exists():
            return False

        # Basic verification: file exists and has size > 0
        if backup_path.stat().st_size == 0:
            return False

        # Could add more verification here (checksums, test restore, etc.)
        return True

    def _get_size(self, path: Path) -> int:
        """Get total size of file or directory."""
        if path.is_file():
            return path.stat().st_size
        elif path.is_dir():
            total = 0
            for item in path.rglob("*"):
                if item.is_file():
                    total += item.stat().st_size
            return total
        return 0

    def _format_size(self, size_bytes: int) -> str:
        """Format size in human-readable format."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} PB"

    def _save_metadata(self, backup_info: BackupInfo):
        """Save backup metadata to JSON file."""
        metadata_path = self.backup_dir / f"{backup_info.filename}.json"

        metadata = {
            "filename": backup_info.filename,
            "database_type": backup_info.database_type,
            "database_name": backup_info.database_name,
            "timestamp": backup_info.timestamp.isoformat(),
            "size_bytes": backup_info.size_bytes,
            "compressed": backup_info.compressed,
            "verified": backup_info.verified
        }

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Database backup tool")
    parser.add_argument("--db", required=True, choices=["mongodb", "postgres"],
                       help="Database type")
    parser.add_argument("--backup-dir", default="./backups",
                       help="Backup directory")

    subparsers = parser.add_subparsers(dest="command", required=True)

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create backup")
    backup_parser.add_argument("--uri", required=True, help="Database connection string")
    backup_parser.add_argument("--database", help="Database name")
    backup_parser.add_argument("--no-compress", action="store_true",
                              help="Disable compression")
    backup_parser.add_argument("--no-verify", action="store_true",
                              help="Skip verification")

    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore backup")
    restore_parser.add_argument("filename", help="Backup filename")
    restore_parser.add_argument("--uri", required=True, help="Database connection string")
    restore_parser.add_argument("--dry-run", action="store_true",
                               help="Show what would be done")

    # List command
    subparsers.add_parser("list", help="List backups")

    # Cleanup command
    cleanup_parser = subparsers.add_parser("cleanup", help="Remove old backups")
    cleanup_parser.add_argument("--retention-days", type=int, default=7,
                               help="Days to retain backups (default: 7)")
    cleanup_parser.add_argument("--dry-run", action="store_true",
                               help="Show what would be removed")

    args = parser.parse_args()

    manager = BackupManager(args.db, args.backup_dir)

    if args.command == "backup":
        backup_info = manager.create_backup(
            args.uri,
            args.database,
            compress=not args.no_compress,
            verify=not args.no_verify
        )
        sys.exit(0 if backup_info else 1)

    elif args.command == "restore":
        success = manager.restore_backup(args.filename, args.uri, args.dry_run)
        sys.exit(0 if success else 1)

    elif args.command == "list":
        backups = manager.list_backups()
        print(f"Total backups: {len(backups)}\n")
        for backup in backups:
            verified_str = "✓" if backup.verified else "?"
            print(f"[{verified_str}] {backup.filename}")
            print(f"    Database: {backup.database_name}")
            print(f"    Created: {backup.timestamp}")
            print(f"    Size: {manager._format_size(backup.size_bytes)}")
            print()

    elif args.command == "cleanup":
        removed = manager.cleanup_old_backups(args.retention_days, args.dry_run)
        print(f"Removed {removed} backup(s)")


if __name__ == "__main__":
    main()
