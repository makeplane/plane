"""Tests for db_performance_check.py"""

import json
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

import pytest

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db_performance_check import (
    SlowQuery, IndexRecommendation, PerformanceReport, PerformanceAnalyzer
)


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


class TestSlowQuery:
    """Test SlowQuery dataclass."""

    def test_slow_query_creation(self):
        """Test creating slow query object."""
        query = SlowQuery(
            query="SELECT * FROM users",
            execution_time_ms=150.5,
            count=10
        )

        assert query.query == "SELECT * FROM users"
        assert query.execution_time_ms == 150.5
        assert query.count == 10


class TestIndexRecommendation:
    """Test IndexRecommendation dataclass."""

    def test_recommendation_creation(self):
        """Test creating index recommendation."""
        rec = IndexRecommendation(
            collection_or_table="users",
            fields=["email"],
            reason="Frequently queried field",
            estimated_benefit="High"
        )

        assert rec.collection_or_table == "users"
        assert rec.fields == ["email"]
        assert rec.reason == "Frequently queried field"
        assert rec.estimated_benefit == "High"


class TestPerformanceReport:
    """Test PerformanceReport dataclass."""

    def test_report_creation(self):
        """Test creating performance report."""
        report = PerformanceReport(
            database_type="mongodb",
            database_name="testdb",
            timestamp=datetime.now(),
            slow_queries=[],
            index_recommendations=[],
            database_metrics={}
        )

        assert report.database_type == "mongodb"
        assert report.database_name == "testdb"
        assert isinstance(report.slow_queries, list)
        assert isinstance(report.index_recommendations, list)
        assert isinstance(report.database_metrics, dict)


class TestPerformanceAnalyzer:
    """Test PerformanceAnalyzer class."""

    def test_init(self):
        """Test analyzer initialization."""
        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost", 100)

        assert analyzer.db_type == "mongodb"
        assert analyzer.connection_string == "mongodb://localhost"
        assert analyzer.threshold_ms == 100

    @patch('db_performance_check.MongoClient')
    def test_connect_mongodb(self, mock_client_class, mock_mongo_client):
        """Test MongoDB connection."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")
        result = analyzer.connect()

        assert result is True
        assert analyzer.client == mock_client
        assert analyzer.db == mock_db

    @patch('db_performance_check.psycopg2')
    def test_connect_postgres(self, mock_psycopg2, mock_postgres_conn):
        """Test PostgreSQL connection."""
        mock_conn, mock_cursor = mock_postgres_conn
        mock_psycopg2.connect.return_value = mock_conn

        analyzer = PerformanceAnalyzer("postgres", "postgresql://localhost")
        result = analyzer.connect()

        assert result is True
        assert analyzer.conn == mock_conn

    def test_connect_unsupported_db(self):
        """Test connection with unsupported database type."""
        analyzer = PerformanceAnalyzer("unsupported", "connection_string")
        result = analyzer.connect()

        assert result is False

    @patch('db_performance_check.MongoClient')
    def test_analyze_mongodb(self, mock_client_class, mock_mongo_client):
        """Test MongoDB performance analysis."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        # Mock profiling
        mock_db.command.side_effect = [
            {"was": 0},  # profile -1 (get status)
            {},          # profile 1 (enable)
        ]

        # Mock slow queries
        mock_profile_cursor = MagicMock()
        mock_profile_cursor.sort.return_value = [
            {
                "command": {"find": "users"},
                "millis": 150,
                "ns": "testdb.users",
                "planSummary": "COLLSCAN"
            }
        ]
        mock_db.system.profile.find.return_value = mock_profile_cursor

        # Mock collections
        mock_db.list_collection_names.return_value = ["users", "orders"]

        # Mock collection stats
        mock_coll = MagicMock()
        mock_coll.aggregate.return_value = [{"storageStats": {}}]
        mock_coll.list_indexes.return_value = [{"name": "_id_"}]
        mock_coll.find.return_value.limit.return_value = [
            {"_id": 1, "name": "Alice", "email": "alice@example.com"}
        ]
        mock_db.__getitem__.return_value = mock_coll

        # Mock server status and db stats
        mock_client.admin.command.return_value = {
            "connections": {"current": 10},
            "opcounters": {"query": 1000}
        }
        mock_db.command.return_value = {
            "dataSize": 1024 * 1024 * 100,
            "indexSize": 1024 * 1024 * 10,
            "collections": 5
        }

        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")
        analyzer.connect()

        report = analyzer.analyze()

        assert report is not None
        assert report.database_type == "mongodb"
        assert isinstance(report.slow_queries, list)
        assert isinstance(report.index_recommendations, list)
        assert isinstance(report.database_metrics, dict)

    @patch('db_performance_check.psycopg2')
    def test_analyze_postgres(self, mock_psycopg2, mock_postgres_conn):
        """Test PostgreSQL performance analysis."""
        mock_conn, mock_cursor = mock_postgres_conn
        mock_psycopg2.connect.return_value = mock_conn

        # Mock cursor results
        mock_cursor.fetchone.side_effect = [
            {"has_extension": True},  # pg_stat_statements check
            {"connections": 10, "commits": 1000, "rollbacks": 5},  # stats
            {"db_size": 1024 * 1024 * 500},  # database size
            {"cache_hit_ratio": 0.95}  # cache hit ratio
        ]

        mock_cursor.fetchall.side_effect = [
            # Slow queries
            [
                {
                    "query": "SELECT * FROM users",
                    "mean_exec_time": 150.5,
                    "calls": 100,
                    "total_exec_time": 15050
                }
            ],
            # Sequential scans
            [
                {
                    "schemaname": "public",
                    "tablename": "users",
                    "seq_scan": 5000,
                    "seq_tup_read": 500000,
                    "idx_scan": 100
                }
            ],
            # Unused indexes
            []
        ]

        analyzer = PerformanceAnalyzer("postgres", "postgresql://localhost")
        analyzer.connect()

        report = analyzer.analyze()

        assert report is not None
        assert report.database_type == "postgres"
        assert len(report.slow_queries) > 0
        assert len(report.index_recommendations) > 0

    def test_print_report(self, capsys):
        """Test report printing."""
        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")

        report = PerformanceReport(
            database_type="mongodb",
            database_name="testdb",
            timestamp=datetime.now(),
            slow_queries=[
                SlowQuery(
                    query="db.users.find({age: {$gte: 18}})",
                    execution_time_ms=150.5,
                    count=10,
                    collection_or_table="users"
                )
            ],
            index_recommendations=[
                IndexRecommendation(
                    collection_or_table="users",
                    fields=["age"],
                    reason="Frequently queried field",
                    estimated_benefit="High"
                )
            ],
            database_metrics={
                "connections": 10,
                "database_size_mb": 100.5
            }
        )

        analyzer.print_report(report)

        captured = capsys.readouterr()
        assert "Database Performance Report" in captured.out
        assert "testdb" in captured.out
        assert "150.5ms" in captured.out
        assert "users" in captured.out

    def test_save_report(self, tmp_path):
        """Test saving report to JSON."""
        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")

        report = PerformanceReport(
            database_type="mongodb",
            database_name="testdb",
            timestamp=datetime.now(),
            slow_queries=[],
            index_recommendations=[],
            database_metrics={}
        )

        output_file = tmp_path / "report.json"
        analyzer.save_report(report, str(output_file))

        assert output_file.exists()

        with open(output_file) as f:
            data = json.load(f)
            assert data["database_type"] == "mongodb"
            assert data["database_name"] == "testdb"

    def test_disconnect(self):
        """Test disconnection."""
        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")

        # Mock client and connection
        analyzer.client = MagicMock()
        analyzer.conn = MagicMock()

        analyzer.disconnect()

        analyzer.client.close.assert_called_once()
        analyzer.conn.close.assert_called_once()

    @patch('db_performance_check.MongoClient')
    def test_analyze_error_handling(self, mock_client_class, mock_mongo_client):
        """Test error handling during analysis."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        # Simulate error
        mock_db.command.side_effect = Exception("Database error")

        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost")
        analyzer.connect()

        report = analyzer.analyze()

        assert report is None


class TestIntegration:
    """Integration tests."""

    @patch('db_performance_check.MongoClient')
    def test_full_mongodb_workflow(self, mock_client_class, mock_mongo_client, tmp_path):
        """Test complete MongoDB analysis workflow."""
        mock_client, mock_db = mock_mongo_client
        mock_client_class.return_value = mock_client

        # Setup mocks
        mock_db.command.return_value = {"was": 0}
        mock_db.system.profile.find.return_value.sort.return_value = []
        mock_db.list_collection_names.return_value = []
        mock_client.admin.command.return_value = {
            "connections": {"current": 10},
            "opcounters": {"query": 1000}
        }

        analyzer = PerformanceAnalyzer("mongodb", "mongodb://localhost", 100)

        # Connect
        assert analyzer.connect() is True

        # Analyze
        report = analyzer.analyze()
        assert report is not None

        # Save report
        output_file = tmp_path / "report.json"
        analyzer.save_report(report, str(output_file))
        assert output_file.exists()

        # Disconnect
        analyzer.disconnect()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
