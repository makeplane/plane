#!/usr/bin/env python3
"""
Database performance analysis tool for MongoDB and PostgreSQL.
Analyzes slow queries, recommends indexes, and generates reports.
"""

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

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
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False


@dataclass
class SlowQuery:
    """Represents a slow query."""

    query: str
    execution_time_ms: float
    count: int
    collection_or_table: Optional[str] = None
    index_used: Optional[str] = None


@dataclass
class IndexRecommendation:
    """Index recommendation."""

    collection_or_table: str
    fields: List[str]
    reason: str
    estimated_benefit: str


@dataclass
class PerformanceReport:
    """Performance analysis report."""

    database_type: str
    database_name: str
    timestamp: datetime
    slow_queries: List[SlowQuery]
    index_recommendations: List[IndexRecommendation]
    database_metrics: Dict[str, any]


class PerformanceAnalyzer:
    """Analyzes database performance."""

    def __init__(self, db_type: str, connection_string: str, threshold_ms: int = 100):
        """
        Initialize performance analyzer.

        Args:
            db_type: Database type ('mongodb' or 'postgres')
            connection_string: Database connection string
            threshold_ms: Slow query threshold in milliseconds
        """
        self.db_type = db_type.lower()
        self.connection_string = connection_string
        self.threshold_ms = threshold_ms

        self.client = None
        self.db = None
        self.conn = None

    def connect(self) -> bool:
        """Connect to database."""
        try:
            if self.db_type == "mongodb":
                if not MONGO_AVAILABLE:
                    print("Error: pymongo not installed")
                    return False
                self.client = MongoClient(self.connection_string)
                self.db = self.client.get_default_database()
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

    def analyze(self) -> Optional[PerformanceReport]:
        """
        Analyze database performance.

        Returns:
            PerformanceReport if successful, None otherwise
        """
        try:
            if self.db_type == "mongodb":
                return self._analyze_mongodb()
            elif self.db_type == "postgres":
                return self._analyze_postgres()
            else:
                return None

        except Exception as e:
            print(f"Analysis error: {e}")
            return None

    def _analyze_mongodb(self) -> PerformanceReport:
        """Analyze MongoDB performance."""
        slow_queries = []
        index_recommendations = []

        # Enable profiling if not enabled
        profiling_level = self.db.command("profile", -1)
        if profiling_level.get("was", 0) == 0:
            self.db.command("profile", 1, slowms=self.threshold_ms)

        # Get slow queries from system.profile
        for doc in self.db.system.profile.find(
            {"millis": {"$gte": self.threshold_ms}},
            limit=50
        ).sort("millis", -1):

            query_str = json.dumps(doc.get("command", {}), default=str)

            slow_queries.append(SlowQuery(
                query=query_str,
                execution_time_ms=doc.get("millis", 0),
                count=1,
                collection_or_table=doc.get("ns", "").split(".")[-1] if "ns" in doc else None,
                index_used=doc.get("planSummary")
            ))

        # Analyze collections for index recommendations
        for coll_name in self.db.list_collection_names():
            if coll_name.startswith("system."):
                continue

            coll = self.db[coll_name]

            # Check for collections scans
            stats = coll.aggregate([
                {"$collStats": {"storageStats": {}}}
            ]).next()

            # Check if collection has indexes
            indexes = list(coll.list_indexes())

            if len(indexes) <= 1:  # Only _id index
                # Recommend indexes based on common patterns
                # Sample documents to find frequently queried fields
                sample = list(coll.find().limit(100))

                if sample:
                    # Find fields that appear in most documents
                    field_freq = {}
                    for doc in sample:
                        for field in doc.keys():
                            if field != "_id":
                                field_freq[field] = field_freq.get(field, 0) + 1

                    # Recommend index on most common field
                    if field_freq:
                        top_field = max(field_freq.items(), key=lambda x: x[1])[0]
                        index_recommendations.append(IndexRecommendation(
                            collection_or_table=coll_name,
                            fields=[top_field],
                            reason="Frequently queried field without index",
                            estimated_benefit="High"
                        ))

        # Get database metrics
        server_status = self.client.admin.command("serverStatus")
        db_stats = self.db.command("dbStats")

        metrics = {
            "connections": server_status.get("connections", {}).get("current", 0),
            "operations_per_sec": server_status.get("opcounters", {}).get("query", 0),
            "database_size_mb": db_stats.get("dataSize", 0) / (1024 * 1024),
            "index_size_mb": db_stats.get("indexSize", 0) / (1024 * 1024),
            "collections": db_stats.get("collections", 0)
        }

        return PerformanceReport(
            database_type="mongodb",
            database_name=self.db.name,
            timestamp=datetime.now(),
            slow_queries=slow_queries[:10],  # Top 10
            index_recommendations=index_recommendations,
            database_metrics=metrics
        )

    def _analyze_postgres(self) -> PerformanceReport:
        """Analyze PostgreSQL performance."""
        slow_queries = []
        index_recommendations = []

        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if pg_stat_statements extension is available
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
                ) AS has_extension
            """)
            has_pg_stat_statements = cur.fetchone()["has_extension"]

            if has_pg_stat_statements:
                # Get slow queries from pg_stat_statements
                cur.execute("""
                    SELECT
                        query,
                        mean_exec_time,
                        calls,
                        total_exec_time
                    FROM pg_stat_statements
                    WHERE mean_exec_time >= %s
                    ORDER BY mean_exec_time DESC
                    LIMIT 10
                """, (self.threshold_ms,))

                for row in cur.fetchall():
                    slow_queries.append(SlowQuery(
                        query=row["query"],
                        execution_time_ms=row["mean_exec_time"],
                        count=row["calls"]
                    ))

            # Find tables with sequential scans (potential index candidates)
            cur.execute("""
                SELECT
                    schemaname,
                    tablename,
                    seq_scan,
                    seq_tup_read,
                    idx_scan
                FROM pg_stat_user_tables
                WHERE seq_scan > 1000
                    AND (idx_scan IS NULL OR seq_scan > idx_scan * 2)
                ORDER BY seq_tup_read DESC
                LIMIT 10
            """)

            for row in cur.fetchall():
                index_recommendations.append(IndexRecommendation(
                    collection_or_table=f"{row['schemaname']}.{row['tablename']}",
                    fields=["<analyze query patterns>"],
                    reason=f"High sequential scans ({row['seq_scan']}) vs index scans ({row['idx_scan'] or 0})",
                    estimated_benefit="High" if row["seq_tup_read"] > 100000 else "Medium"
                ))

            # Find unused indexes
            cur.execute("""
                SELECT
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan
                FROM pg_stat_user_indexes
                WHERE idx_scan = 0
                    AND indexname NOT LIKE '%_pkey'
                ORDER BY pg_relation_size(indexrelid) DESC
            """)

            unused_indexes = []
            for row in cur.fetchall():
                unused_indexes.append(
                    f"{row['schemaname']}.{row['tablename']}.{row['indexname']}"
                )

            # Database metrics
            cur.execute("""
                SELECT
                    sum(numbackends) AS connections,
                    sum(xact_commit) AS commits,
                    sum(xact_rollback) AS rollbacks
                FROM pg_stat_database
                WHERE datname = current_database()
            """)
            stats = cur.fetchone()

            cur.execute("""
                SELECT pg_database_size(current_database()) AS db_size
            """)
            db_size = cur.fetchone()["db_size"]

            cur.execute("""
                SELECT
                    sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS cache_hit_ratio
                FROM pg_statio_user_tables
            """)
            cache_ratio = cur.fetchone()["cache_hit_ratio"] or 0

            metrics = {
                "connections": stats["connections"],
                "commits": stats["commits"],
                "rollbacks": stats["rollbacks"],
                "database_size_mb": db_size / (1024 * 1024),
                "cache_hit_ratio": float(cache_ratio),
                "unused_indexes": unused_indexes
            }

        return PerformanceReport(
            database_type="postgres",
            database_name=self.conn.info.dbname,
            timestamp=datetime.now(),
            slow_queries=slow_queries,
            index_recommendations=index_recommendations,
            database_metrics=metrics
        )

    def print_report(self, report: PerformanceReport):
        """Print performance report."""
        print("=" * 80)
        print(f"Database Performance Report - {report.database_type.upper()}")
        print(f"Database: {report.database_name}")
        print(f"Timestamp: {report.timestamp}")
        print("=" * 80)

        print("\n## Database Metrics")
        print("-" * 80)
        for key, value in report.database_metrics.items():
            if isinstance(value, float):
                print(f"{key}: {value:.2f}")
            else:
                print(f"{key}: {value}")

        print("\n## Slow Queries")
        print("-" * 80)
        if report.slow_queries:
            for i, query in enumerate(report.slow_queries, 1):
                print(f"\n{i}. Execution Time: {query.execution_time_ms:.2f}ms | Count: {query.count}")
                if query.collection_or_table:
                    print(f"   Collection/Table: {query.collection_or_table}")
                if query.index_used:
                    print(f"   Index Used: {query.index_used}")
                print(f"   Query: {query.query[:200]}...")
        else:
            print("No slow queries found")

        print("\n## Index Recommendations")
        print("-" * 80)
        if report.index_recommendations:
            for i, rec in enumerate(report.index_recommendations, 1):
                print(f"\n{i}. {rec.collection_or_table}")
                print(f"   Fields: {', '.join(rec.fields)}")
                print(f"   Reason: {rec.reason}")
                print(f"   Estimated Benefit: {rec.estimated_benefit}")

                if report.database_type == "mongodb":
                    index_spec = {field: 1 for field in rec.fields}
                    print(f"   Command: db.{rec.collection_or_table}.createIndex({json.dumps(index_spec)})")
                elif report.database_type == "postgres":
                    fields_str = ", ".join(rec.fields)
                    print(f"   Command: CREATE INDEX idx_{rec.collection_or_table.replace('.', '_')}_{rec.fields[0]} ON {rec.collection_or_table}({fields_str});")
        else:
            print("No index recommendations")

        print("\n" + "=" * 80)

    def save_report(self, report: PerformanceReport, filename: str):
        """Save report to JSON file."""
        # Convert dataclasses to dict
        report_dict = {
            "database_type": report.database_type,
            "database_name": report.database_name,
            "timestamp": report.timestamp.isoformat(),
            "slow_queries": [asdict(q) for q in report.slow_queries],
            "index_recommendations": [asdict(r) for r in report.index_recommendations],
            "database_metrics": report.database_metrics
        }

        with open(filename, "w") as f:
            json.dump(report_dict, f, indent=2, default=str)

        print(f"\nReport saved to: {filename}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Database performance analysis tool")
    parser.add_argument("--db", required=True, choices=["mongodb", "postgres"],
                       help="Database type")
    parser.add_argument("--uri", required=True, help="Database connection string")
    parser.add_argument("--threshold", type=int, default=100,
                       help="Slow query threshold in milliseconds (default: 100)")
    parser.add_argument("--output", help="Save report to JSON file")

    args = parser.parse_args()

    analyzer = PerformanceAnalyzer(args.db, args.uri, args.threshold)

    if not analyzer.connect():
        sys.exit(1)

    try:
        print(f"Analyzing {args.db} performance (threshold: {args.threshold}ms)...")
        report = analyzer.analyze()

        if report:
            analyzer.print_report(report)

            if args.output:
                analyzer.save_report(report, args.output)

            sys.exit(0)
        else:
            print("Analysis failed")
            sys.exit(1)

    finally:
        analyzer.disconnect()


if __name__ == "__main__":
    main()
