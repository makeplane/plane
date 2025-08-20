import time
import json
from datetime import datetime
from django.core.management.base import BaseCommand, CommandParser
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.conf import settings

from plane.ee.documents import (
    get_batch_queue_stats,
    get_all_search_relevant_models,
    cleanup_stale_queue_for_model,
    force_drain_queue_for_model,
    get_queue_health_info,
)
from plane.utils.exception_logger import log_exception


class Command(BaseCommand):
    """Monitor OpenSearch batch update Redis queues.

    This command provides various monitoring options for the Redis queues
    used in batched OpenSearch updates through sub-commands.

    Sub-commands:
        status      Show current queue status (default)
        watch       Watch queue in real-time
        cleanup     Clean up stale queues
        force-drain Emergency force drain queues

    Examples:
        # Show current queue status
        python manage.py monitor_search_queue status
        python manage.py monitor_search_queue  # status is default

        # Show detailed queue information
        python manage.py monitor_search_queue status --detailed

        # Check specific models only
        python manage.py monitor_search_queue status --models Issue Project

        # Show queue statistics in JSON format
        python manage.py monitor_search_queue status --json

        # Watch queue in real-time (refreshes every 5 seconds)
        python manage.py monitor_search_queue watch

        # Watch with custom interval
        python manage.py monitor_search_queue watch --interval 10

        # Clean up stale queues
        python manage.py monitor_search_queue cleanup

        # Emergency: Force drain all queues (DANGER - loses all pending updates)
        python manage.py monitor_search_queue force-drain

        # Emergency: Force drain specific models
        python manage.py monitor_search_queue force-drain --models Issue Project
    """

    help = "Monitor OpenSearch batch update Redis queues"

    def add_arguments(self, parser: CommandParser):
        subparsers = parser.add_subparsers(
            dest="subcommand",
            help="Available sub-commands",
            description="Choose an operation to perform on the search queues",
        )

        # Status sub-command (default)
        status_parser = subparsers.add_parser(
            "status", help="Show current queue status (default)"
        )
        status_parser.add_argument(
            "--detailed",
            action="store_true",
            help="Show detailed queue information including health metrics",
        )
        status_parser.add_argument(
            "--models",
            nargs="+",
            help="Monitor specific models only (e.g., --models Issue Project)",
        )
        status_parser.add_argument(
            "--json",
            action="store_true",
            help="Output in JSON format",
        )

        # Watch sub-command
        watch_parser = subparsers.add_parser("watch", help="Watch queue in real-time")
        watch_parser.add_argument(
            "--interval",
            type=int,
            default=5,
            help="Refresh interval in seconds (default: 5)",
        )
        watch_parser.add_argument(
            "--detailed",
            action="store_true",
            help="Show detailed queue information",
        )
        watch_parser.add_argument(
            "--models",
            nargs="+",
            help="Monitor specific models only",
        )

        # Cleanup sub-command
        cleanup_parser = subparsers.add_parser(
            "cleanup", help="Clean up stale queues for all models"
        )

        # Force-drain sub-command
        force_drain_parser = subparsers.add_parser(
            "force-drain",
            help="Emergency: Force drain queues (DANGER - loses all pending updates)",
        )
        force_drain_parser.add_argument(
            "--models",
            nargs="+",
            help="Specific models to drain (if none specified, drains all models)",
        )

    def handle(self, *args, **options):
        if not getattr(settings, "OPENSEARCH_ENABLED", False):
            self.stderr.write(
                self.style.ERROR(
                    "OpenSearch is not enabled. Set OPENSEARCH_ENABLED=true."
                )
            )
            return

        subcommand = options.get("subcommand", "status")  # Default to status

        if subcommand == "status":
            self.handle_status(options)
        elif subcommand == "watch":
            self.handle_watch(options)
        elif subcommand == "cleanup":
            self.handle_cleanup(options)
        elif subcommand == "force-drain":
            self.handle_force_drain(options)
        else:
            # Fallback to status if no subcommand specified
            self.handle_status(options)

    def handle_status(self, options):
        """Handle the status sub-command."""
        self.stdout.write(self.style.SUCCESS("OpenSearch Batch Update Queue Status"))
        self.stdout.write("=" * 50)

        try:
            queue_stats = get_batch_queue_stats(detailed=options.get("detailed", False))

            if options.get("json", False):
                self.stdout.write(json.dumps(queue_stats, indent=2))
                return

            # Filter by specific models if requested
            if options.get("models"):
                queue_stats = self._filter_queue_stats_by_models(
                    queue_stats, options["models"]
                )

            if not queue_stats:
                self.stdout.write(self.style.WARNING("No queue statistics available"))
                return

            self._display_queue_summary(queue_stats)
            self._display_per_model_statistics(queue_stats, options)
            self._display_health_indicators(queue_stats, options)

        except Exception as e:
            log_exception(e)
            self.stderr.write(self.style.ERROR(f"Failed to get queue statistics: {e}"))

    def handle_watch(self, options):
        """Handle the watch sub-command."""
        interval = options.get("interval", 5)

        self.stdout.write(
            self.style.SUCCESS(
                f"Watching queues (refreshing every {interval}s, press Ctrl+C to stop)..."
            )
        )

        try:
            while True:
                # Clear screen (works on most terminals)
                self.stdout.write("\033[2J\033[H")

                # Show current time
                current_time = timezone.now().strftime("%Y-%m-%d %H:%M:%S")
                self.stdout.write(f"Last updated: {current_time}\n")

                # Show queue status without header
                self._show_queue_status_content(options)

                time.sleep(interval)

        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("\nMonitoring stopped."))

    def handle_cleanup(self, options):
        """Handle the cleanup sub-command."""
        self.stdout.write(
            self.style.WARNING(
                "Running enhanced cleanup (1-hour age limit, 10k size limit)..."
            )
        )

        try:
            all_models = get_all_search_relevant_models()
            total_stats = {
                "models_processed": 0,
                "total_stale_removed": 0,
                "total_invalid_removed": 0,
                "total_excess_removed": 0,
                "queues_deleted": 0,
                "problematic_models": [],
            }

            for model_name in all_models:
                try:
                    cleanup_stats = cleanup_stale_queue_for_model(
                        model_name, max_age_hours=1, max_queue_size=10000
                    )

                    total_stats["models_processed"] += 1
                    total_stats["total_stale_removed"] += cleanup_stats["removed_stale"]
                    total_stats["total_invalid_removed"] += cleanup_stats[
                        "removed_invalid"
                    ]
                    total_stats["total_excess_removed"] += cleanup_stats[
                        "removed_excess"
                    ]

                    if cleanup_stats["queue_deleted"]:
                        total_stats["queues_deleted"] += 1

                    # Show model-specific results
                    total_removed = (
                        cleanup_stats["removed_stale"]
                        + cleanup_stats["removed_invalid"]
                        + cleanup_stats["removed_excess"]
                    )

                    if total_removed > 0:
                        details = []
                        if cleanup_stats["removed_stale"]:
                            details.append(f"{cleanup_stats['removed_stale']} stale")
                        if cleanup_stats["removed_invalid"]:
                            details.append(
                                f"{cleanup_stats['removed_invalid']} invalid"
                            )
                        if cleanup_stats["removed_excess"]:
                            details.append(f"{cleanup_stats['removed_excess']} excess")

                        style = (
                            self.style.WARNING
                            if total_removed > 100
                            else self.style.SUCCESS
                        )
                        self.stdout.write(
                            style(
                                f"  {model_name}: Removed {total_removed} items ({', '.join(details)})"
                            )
                        )

                        if total_removed > 100:
                            total_stats["problematic_models"].append(model_name)

                    if cleanup_stats["errors"]:
                        for error in cleanup_stats["errors"]:
                            self.stderr.write(
                                self.style.ERROR(f"  {model_name}: {error}")
                            )

                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(f"  {model_name}: Failed to cleanup - {e}")
                    )

            # Show summary
            total_cleaned = (
                total_stats["total_stale_removed"]
                + total_stats["total_invalid_removed"]
                + total_stats["total_excess_removed"]
            )

            if total_cleaned > 0:
                self.stdout.write("")
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Cleanup completed: {total_cleaned} total items removed "
                        f"({total_stats['total_stale_removed']} stale, "
                        f"{total_stats['total_invalid_removed']} invalid, "
                        f"{total_stats['total_excess_removed']} excess)"
                    )
                )

                if total_stats["queues_deleted"]:
                    self.stdout.write(
                        f"Deleted {total_stats['queues_deleted']} empty queues"
                    )

                # Warn about problematic models
                if total_stats["problematic_models"]:
                    self.stdout.write("")
                    self.stdout.write(
                        self.style.WARNING(
                            f"⚠️  Large cleanup for models: {', '.join(total_stats['problematic_models'])} "
                            f"- check for worker issues"
                        )
                    )
            else:
                self.stdout.write(
                    self.style.SUCCESS("✅ No stale items found - queues are healthy")
                )

        except Exception as e:
            log_exception(e)
            self.stderr.write(self.style.ERROR(f"Cleanup failed: {e}"))

    def handle_force_drain(self, options):
        """Handle the force-drain sub-command."""
        force_drain_models = options.get("models", [])

        if not force_drain_models:  # Empty list means drain all
            force_drain_models = get_all_search_relevant_models()

        self.stdout.write(
            self.style.ERROR(
                f"⚠️  EMERGENCY FORCE DRAIN of {len(force_drain_models)} models"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                "This will completely empty the queues - all pending updates will be lost!"
            )
        )

        # Ask for confirmation
        if not (options.get("verbosity", 1) >= 2):  # Skip confirmation in verbose mode
            confirm = input("Type 'YES' to continue: ")
            if confirm != "YES":
                self.stdout.write("Aborted.")
                return

        try:
            total_drained = 0

            for model_name in force_drain_models:
                try:
                    drain_stats = force_drain_queue_for_model(model_name)

                    if (
                        drain_stats["force_drained"]
                        and drain_stats["removed_excess"] > 0
                    ):
                        self.stdout.write(
                            self.style.ERROR(
                                f"  {model_name}: FORCE DRAINED {drain_stats['removed_excess']} items"
                            )
                        )
                        total_drained += drain_stats["removed_excess"]
                    elif drain_stats["queue_deleted"]:
                        self.stdout.write(f"  {model_name}: Queue was already empty")

                    if drain_stats["errors"]:
                        for error in drain_stats["errors"]:
                            self.stderr.write(
                                self.style.ERROR(f"  {model_name}: {error}")
                            )

                except Exception as e:
                    self.stderr.write(
                        self.style.ERROR(f"  {model_name}: Failed to force drain - {e}")
                    )

            if total_drained > 0:
                self.stdout.write("")
                self.stdout.write(
                    self.style.ERROR(
                        f"⚠️  FORCE DRAIN COMPLETED: {total_drained} total items removed"
                    )
                )
                self.stdout.write(
                    self.style.WARNING(
                        "These updates are permanently lost. Check worker status and restart if needed."
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS("✅ All queues were already empty")
                )

        except Exception as e:
            log_exception(e)
            self.stderr.write(self.style.ERROR(f"Force drain failed: {e}"))

    def _show_queue_status_content(self, options):
        """Show queue status content without header (used by watch)."""
        try:
            queue_stats = get_batch_queue_stats(detailed=options.get("detailed", False))

            # Filter by specific models if requested
            if options.get("models"):
                queue_stats = self._filter_queue_stats_by_models(
                    queue_stats, options["models"]
                )

            if not queue_stats:
                self.stdout.write(self.style.WARNING("No queue statistics available"))
                return

            self._display_queue_summary(queue_stats)
            self._display_per_model_statistics(queue_stats, options)
            self._display_health_indicators(queue_stats, options)

        except Exception as e:
            log_exception(e)
            self.stderr.write(self.style.ERROR(f"Failed to get queue statistics: {e}"))

    def _filter_queue_stats_by_models(self, queue_stats, requested_models):
        """Filter queue statistics by requested models."""
        filtered_stats = {}
        for model in requested_models:
            if model in queue_stats:
                filtered_stats[model] = queue_stats[model]
            else:
                self.stderr.write(
                    self.style.WARNING(f"Model '{model}' not found in queue stats")
                )
        return filtered_stats

    def _display_queue_summary(self, queue_stats):
        """Display summary statistics."""
        total_queued = sum(
            stats.get("queue_length", 0)
            for stats in queue_stats.values()
            if isinstance(stats, dict) and "queue_length" in stats
        )
        active_models = sum(
            1
            for stats in queue_stats.values()
            if isinstance(stats, dict) and stats.get("queue_length", 0) > 0
        )

        self.stdout.write(f"Total queued items: {total_queued}")
        self.stdout.write(f"Active models: {active_models}/{len(queue_stats)}")
        self.stdout.write("")

    def _display_per_model_statistics(self, queue_stats, options):
        """Display per-model statistics."""
        for model_name, stats in sorted(queue_stats.items()):
            if not isinstance(stats, dict):
                continue

            queue_length = stats.get("queue_length", 0)
            style, status = self._get_model_status_style(stats, options, queue_length)

            self.stdout.write(
                f"{model_name:20} {style(f'{queue_length:>6} items')} [{status}]"
            )

            if options.get("detailed", False) and queue_length > 0:
                self._display_detailed_model_info(stats)

    def _get_model_status_style(self, stats, options, queue_length):
        """Determine style and status for model based on health info or queue length."""
        if options.get("detailed", False) and "health_status" in stats:
            health_status = stats["health_status"]
            if health_status == "healthy":
                return self.style.SUCCESS, "HEALTHY"
            elif health_status in ["stale_items", "corrupted_data"]:
                return self.style.WARNING, health_status.upper()
            elif health_status in ["critical_size", "error"]:
                return self.style.ERROR, health_status.upper()
            elif health_status == "empty":
                return self.style.SUCCESS, "EMPTY"
            else:
                # Use WARNING for unknown status to ensure compatibility
                return self.style.WARNING, health_status.upper()
        else:
            # Basic mode - just use queue length
            if queue_length > 0:
                style = self.style.WARNING if queue_length > 100 else self.style.SUCCESS
                return style, "ACTIVE"
            else:
                return self.style.SUCCESS, "EMPTY"

    def _display_detailed_model_info(self, stats):
        """Display detailed information for a model."""
        if "oldest_timestamp" in stats and stats["oldest_timestamp"]:
            oldest = stats["oldest_timestamp"][:19]  # Remove microseconds
            self.stdout.write(f"{'':22} Oldest: {oldest}")

        if "newest_timestamp" in stats and stats["newest_timestamp"]:
            newest = stats["newest_timestamp"][:19]
            self.stdout.write(f"{'':22} Newest: {newest}")

        if "avg_age_minutes" in stats and stats["avg_age_minutes"] is not None:
            avg_age = stats["avg_age_minutes"]
            self.stdout.write(f"{'':22} Avg age: {avg_age:.1f} minutes")

        if "invalid_items" in stats and stats["invalid_items"] > 0:
            invalid = stats["invalid_items"]
            self.stdout.write(f"{'':22} Invalid items: {invalid}")

        self.stdout.write("")

    def _display_health_indicators(self, queue_stats, options):
        """Display health indicators."""
        self.stdout.write("")
        self.stdout.write("Health Indicators:")

        # Check for backing up queues
        backing_up = [
            model
            for model, stats in queue_stats.items()
            if stats["queue_length"] > 1000
        ]

        if backing_up:
            self.stdout.write(
                self.style.ERROR(f"⚠️  Large queues detected: {', '.join(backing_up)}")
            )
        else:
            self.stdout.write(self.style.SUCCESS("✅ All queues healthy"))

        # Check for old items (if detailed info available)
        if options.get("detailed", False):
            stale_cutoff = 300  # 5 minutes
            stale_models = []

            for model, stats in queue_stats.items():
                if stats["queue_length"] > 0 and "oldest_timestamp" in stats:
                    oldest_str = stats["oldest_timestamp"]
                    if oldest_str:
                        # Parse the ISO timestamp string into a datetime object
                        oldest = parse_datetime(oldest_str)
                        if oldest:
                            age = (timezone.now() - oldest).total_seconds()
                            if age > stale_cutoff:
                                stale_models.append(f"{model} ({age:.0f}s)")

            if stale_models:
                self.stdout.write(
                    self.style.WARNING(
                        f"⚠️  Stale items detected: {', '.join(stale_models)}"
                    )
                )
            else:
                self.stdout.write(self.style.SUCCESS("✅ No stale items detected"))
