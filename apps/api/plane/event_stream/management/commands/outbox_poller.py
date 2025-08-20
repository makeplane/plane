# Standard Library imports
import asyncio
import logging
import os
import signal
import sys
from typing import List, Callable, Dict, Any
from urllib.parse import quote

# Third Party imports
import psycopg
import psutil
import psycopg_pool

# Django imports
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.utils.exception_logger import log_exception
from plane.event_stream.publisher import get_publisher
from plane.event_stream.models.outbox import OutboxEvent


# Defaults
BATCH_SIZE = int(os.environ.get("OUTBOX_POLLER_BATCH_SIZE", 250))
INTERVAL_MIN = float(os.environ.get("OUTBOX_POLLER_INTERVAL_MIN", 0.25))
INTERVAL_MAX = float(os.environ.get("OUTBOX_POLLER_INTERVAL_MAX", 2.0))
MEMORY_LIMIT_MB = int(os.environ.get("OUTBOX_POLLER_MEMORY_LIMIT_MB", 500))
MEMORY_CHECK_INTERVAL = int(os.environ.get("OUTBOX_POLLER_MEMORY_CHECK_INTERVAL", 30))

# Connection Pool Configuration
POOL_SIZE = int(os.environ.get("OUTBOX_POLLER_POOL_SIZE", 4))
POOL_MIN_SIZE = int(os.environ.get("OUTBOX_POLLER_POOL_MIN_SIZE", 2))
POOL_MAX_SIZE = int(os.environ.get("OUTBOX_POLLER_POOL_MAX_SIZE", 10))
POOL_TIMEOUT = float(os.environ.get("OUTBOX_POLLER_POOL_TIMEOUT", 30.0))
POOL_MAX_IDLE = float(os.environ.get("OUTBOX_POLLER_POOL_MAX_IDLE", 300.0))
POOL_MAX_LIFETIME = float(os.environ.get("OUTBOX_POLLER_POOL_MAX_LIFETIME", 3600.0))
POOL_RECONNECT_TIMEOUT = float(
    os.environ.get("OUTBOX_POLLER_POOL_RECONNECT_TIMEOUT", 5.0)
)
POOL_HEALTH_CHECK_INTERVAL = int(
    os.environ.get("OUTBOX_POLLER_POOL_HEALTH_CHECK_INTERVAL", 60)
)

# Configuration
RESTART_EXIT_CODE = 100
GRACEFUL_SHUTDOWN_TIMEOUT = 30  # seconds

log = logging.getLogger("plane.event_stream")


class GracefulShutdownHandler:
    """
    Handles graceful shutdown signals for the outbox poller.
    """

    def __init__(self):
        self.shutdown_event = asyncio.Event()
        self.signal_received = None

    def setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown."""
        # Only set up signal handlers if running in the main thread
        try:
            # Handle SIGTERM (sent by Kubernetes when downsizing pods)
            signal.signal(signal.SIGTERM, self._signal_handler)
            # Handle SIGINT (Ctrl+C)
            signal.signal(signal.SIGINT, self._signal_handler)
            # Handle SIGQUIT (Ctrl+\)
            signal.signal(signal.SIGQUIT, self._signal_handler)

            log.info("Signal handlers registered for SIGTERM, SIGINT, SIGQUIT")
        except ValueError as e:
            # This can happen if not running in main thread
            log.warning(f"Could not register signal handlers: {e}")

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        signal_names = {
            signal.SIGTERM: "SIGTERM",
            signal.SIGINT: "SIGINT",
            signal.SIGQUIT: "SIGQUIT",
        }

        signal_name = signal_names.get(signum, f"Signal {signum}")
        self.signal_received = signal_name

        log.info(f"Received {signal_name}, initiating graceful shutdown...")

        # Set the shutdown event to signal all async tasks
        if not self.shutdown_event.is_set():
            self.shutdown_event.set()

    def shutdown_requested(self) -> bool:
        """Check if shutdown has been requested."""
        return self.shutdown_event.is_set()

    async def wait_for_shutdown(self, timeout: float = None):
        """Wait for shutdown signal with optional timeout."""
        if timeout:
            try:
                await asyncio.wait_for(self.shutdown_event.wait(), timeout=timeout)
            except asyncio.TimeoutError:
                pass
        else:
            await self.shutdown_event.wait()


class MemoryMonitor:
    """
    Async memory monitor that checks memory usage periodically and signals restart if limit exceeded.
    """

    def __init__(self, memory_limit_mb: int, check_interval: int):
        self.memory_limit_mb = memory_limit_mb
        self.check_interval = check_interval
        self.process = psutil.Process(os.getpid())
        self._running = False
        self._restart_event = asyncio.Event()  # Use asyncio.Event for signaling

    async def start(self):
        """Start the memory monitoring loop."""
        self._running = True
        while self._running:
            await asyncio.sleep(self.check_interval)
            await self._check_memory()

    async def stop(self):
        """Stop the memory monitoring loop."""
        self._running = False

    def restart_requested(self) -> bool:
        """Check if restart has been requested."""
        return self._restart_event.is_set()

    async def wait_for_restart(self):
        """Wait for restart signal."""
        await self._restart_event.wait()

    async def _check_memory(self):
        """Check current memory usage and request restart if limit exceeded."""
        try:
            mem_mb = self.process.memory_info().rss / 1024 / 1024
            log.info(
                "Memory usage: %.2f MB",
                mem_mb,
                extra={"memory_usage": round(mem_mb, 2)},
            )

            if mem_mb > self.memory_limit_mb:
                log.warning(
                    "Memory usage exceeded limit - requesting restart",
                    extra={
                        "memory_usage": round(mem_mb, 2),
                        "memory_limit": self.memory_limit_mb,
                    },
                )
                self._restart_event.set()  # Signal restart
                self._running = False  # Stop the monitoring loop
        except Exception as e:
            log_exception(e)
            log.warning(f"Failed to check memory usage: {e}")


class DatabaseConnectionPool:
    """
    Manages a psycopg3 async connection pool for outbox polling.
    Includes health checking, connection lifecycle management, and automatic reconnection.
    """

    def __init__(
        self,
        pool_size: int = POOL_SIZE,
        min_size: int = POOL_MIN_SIZE,
        max_size: int = POOL_MAX_SIZE,
        timeout: float = POOL_TIMEOUT,
        max_idle: float = POOL_MAX_IDLE,
        max_lifetime: float = POOL_MAX_LIFETIME,
        reconnect_timeout: float = POOL_RECONNECT_TIMEOUT,
        health_check_interval: int = POOL_HEALTH_CHECK_INTERVAL,
    ):
        self.pool: psycopg_pool.AsyncConnectionPool | None = None
        self.dsn = self._get_dsn_from_settings()
        self.pool_size = pool_size
        self.min_size = min_size
        self.max_size = max_size
        self.timeout = timeout
        self.max_idle = max_idle
        self.max_lifetime = max_lifetime
        self.reconnect_timeout = reconnect_timeout
        self.health_check_interval = health_check_interval
        self._health_check_task: asyncio.Task | None = None
        self._running = False

    def _get_dsn_from_settings(self) -> str:
        """Extract and normalize the DSN from Django settings."""
        dsn = getattr(settings, "DATABASE_URL", None)

        # If DATABASE_URL is not set, use the default database settings
        if not dsn:
            db = settings.DATABASES["default"]
            dsn = (
                f"postgresql://{quote(db['USER'])}:{quote(db['PASSWORD'])}"
                f"@{db['HOST']}:{db['PORT']}/{db['NAME']}"
            )

        # If the DSN starts with postgres://, replace it with postgresql://
        if dsn.startswith("postgres://"):
            dsn = dsn.replace("postgres://", "postgresql://", 1)
        return dsn

    async def connect(self):
        """Initialize the connection pool with comprehensive configuration."""
        try:
            # Create connection pool with advanced configuration
            self.pool = psycopg_pool.AsyncConnectionPool(
                conninfo=self.dsn,
                min_size=self.min_size,
                max_size=self.max_size,
                timeout=self.timeout,
                max_idle=self.max_idle,
                max_lifetime=self.max_lifetime,
                reconnect_timeout=self.reconnect_timeout,
                # Configure connection preparation
                configure=self._configure_connection,
                # Reset connections on return to pool
                reset=self._reset_connection,
                # Explicitly set open=False to avoid deprecation warning
                open=False,
            )

            # Open the pool explicitly
            await self.pool.open()

            # Test the pool with a simple query
            async with self.pool.connection() as conn:
                await conn.execute("SELECT 1")

            log.info(
                "Connection pool established successfully",
                extra={
                    "pool_size": self.pool_size,
                    "min_size": self.min_size,
                    "max_size": self.max_size,
                    "timeout": self.timeout,
                    "max_idle": self.max_idle,
                    "max_lifetime": self.max_lifetime,
                },
            )

            # Start health check monitoring
            self._running = True
            self._health_check_task = asyncio.create_task(self._health_check_loop())

        except Exception as e:
            log.exception(f"Failed to establish connection pool: {e}")
            await self.close()
            raise

    async def _configure_connection(self, conn: psycopg.AsyncConnection):
        """Configure individual connections when they're created."""
        # Set autocommit to False for explicit transaction control
        await conn.set_autocommit(False)

    async def _reset_connection(self, conn: psycopg.AsyncConnection):
        """Reset connection state when returned to pool."""
        # Rollback any uncommitted transactions
        try:
            await conn.rollback()
        except Exception:
            # Connection might already be in a good state
            pass

    async def _health_check_loop(self):
        """Periodic health check for the connection pool."""
        while self._running:
            try:
                await asyncio.sleep(self.health_check_interval)
                if self._running:
                    health_status = await self.health_check()
                    if not health_status["healthy"]:
                        log.warning(
                            "Connection pool health check failed",
                            extra=health_status,
                        )
            except Exception as e:
                log.exception(f"Error in health check loop: {e}")

    async def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive health check of the connection pool.
        Returns detailed health status information.
        """
        if not self.pool:
            return {
                "healthy": False,
                "error": "Pool not initialized",
                "timestamp": timezone.now().isoformat(),
            }

        try:
            # Get pool statistics
            pool_stats = self.pool.get_stats()

            stats = {
                "pool_size": pool_stats.get("pool_size", 0),
                "available_connections": pool_stats.get("pool_available", 0),
                "used_connections": pool_stats.get("pool_size", 0)
                - pool_stats.get("pool_available", 0),
                "waiting_requests": pool_stats.get("requests_waiting", 0),
                "timestamp": timezone.now().isoformat(),
            }

            # Test connection with a simple query
            start_time = asyncio.get_event_loop().time()
            async with self.pool.connection() as conn:
                await conn.execute("SELECT 1")
            response_time = (asyncio.get_event_loop().time() - start_time) * 1000

            stats.update(
                {
                    "healthy": True,
                    "response_time_ms": round(response_time, 2),
                    "pool_status": "operational",
                }
            )

            log.info("Pool health check passed", extra=stats)
            return stats

        except Exception as e:
            error_stats = {
                "healthy": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "timestamp": timezone.now().isoformat(),
            }

            if self.pool:
                try:
                    pool_stats = self.pool.get_stats()
                    error_stats.update(
                        {
                            "pool_size": pool_stats.get("pool_size", 0),
                            "available_connections": pool_stats.get(
                                "pool_available", 0
                            ),
                        }
                    )
                except Exception:
                    # If we can't get stats, that's additional confirmation something is wrong
                    pass

            log.error("Pool health check failed", extra=error_stats)
            return error_stats

    async def get_pool_stats(self) -> Dict[str, Any]:
        """Get current pool statistics."""
        if not self.pool:
            return {"error": "Pool not initialized"}

        try:
            stats = self.pool.get_stats()

            # Add configuration info to the stats
            stats.update(
                {
                    "min_size": self.min_size,
                    "max_size": self.max_size,
                    "timeout": self.timeout,
                    "max_idle": self.max_idle,
                    "max_lifetime": self.max_lifetime,
                    "reconnect_timeout": self.reconnect_timeout,
                }
            )

            return stats
        except Exception as e:
            return {"error": f"Failed to get pool stats: {str(e)}"}

    async def fetch_and_lock_rows(self, batch_size: int) -> List[tuple]:
        """Fetch and lock rows from outbox table using FOR UPDATE SKIP LOCKED."""
        if not self.pool:
            return []

        try:
            async with self.pool.connection() as conn:
                async with conn.transaction():
                    async with conn.cursor() as cur:
                        await cur.execute(
                            """
                        UPDATE outbox
                           SET claimed_at = NOW()
                         WHERE id IN (
                             SELECT id FROM outbox
                              WHERE processed_at IS NULL
                              AND claimed_at IS NULL
                              ORDER BY id
                              LIMIT %s
                              FOR UPDATE SKIP LOCKED
                         )
                         RETURNING id, event_id, event_type, entity_type, entity_id,
                                   payload, processed_at, created_at, claimed_at, 
                                   workspace_id, project_id, initiator_id, initiator_type;
                            """,
                            (batch_size,),
                        )
                        return await cur.fetchall()
        except Exception as e:
            log.error(f"Error fetching and locking rows: {e}")
            return []

    async def mark_processed(self, ids: List[int]) -> bool:
        """Mark events as processed."""
        if not self.pool or not ids:
            return False

        try:
            async with self.pool.connection() as conn:
                async with conn.transaction():
                    async with conn.cursor() as cur:
                        await cur.execute(
                            """
                            UPDATE outbox
                               SET processed_at = NOW()
                             WHERE id = ANY(%s);
                            """,
                            (ids,),
                        )
                        rows_updated = cur.rowcount
                        log.info(f"Marked {rows_updated} rows as processed")
                        return rows_updated > 0
        except Exception as e:
            log.error(f"Error marking events as processed: {e}")
            return False

    async def close(self):
        """Close the connection pool and cleanup resources."""
        self._running = False

        # Cancel health check task
        if self._health_check_task:
            self._health_check_task.cancel()
            try:
                await self._health_check_task
            except asyncio.CancelledError:
                pass
            self._health_check_task = None

        # Close the pool
        if self.pool:
            try:
                await self.pool.close()
                log.info("Connection pool closed successfully")
            except Exception as e:
                log.warning(f"Error closing connection pool: {e}")
            self.pool = None

    async def __aenter__(self) -> "DatabaseConnectionPool":
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_value, traceback):
        await self.close()


class OutboxPoller:
    """
    Async outbox poller with event handler registration pattern and connection pooling.
    """

    def __init__(
        self,
        batch_size: int,
        interval_min: float,
        interval_max: float,
        memory_limit_mb: int,
        memory_check_interval: int,
    ):
        self.batch_size = batch_size
        self.interval_min = interval_min
        self.interval_max = interval_max
        self.memory_limit_mb = memory_limit_mb
        self.memory_check_interval = memory_check_interval
        self.handlers: List[Callable[[Dict[str, Any]], None]] = []
        self.shutdown_handler = GracefulShutdownHandler()

    def add_handler(self, handler: Callable[[Dict[str, Any]], None]) -> None:
        """
        Add a handler function to be invoked with each event.
        :param handler: Callable accepting event data dict
        """
        self.handlers.append(handler)
        log.info(f"Handler registered: {handler.__name__}")

    async def _process_event(self, row: tuple) -> bool:
        """
        Process a single event by calling all registered handlers.
        Returns True if all handlers succeeded, False otherwise.
        """
        # Unpack all fields from the row
        event = OutboxEvent.from_db_row(row)

        handler_errors = []
        for handler in self.handlers:
            try:
                # Check if handler is async
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception as e:
                handler_errors.append((handler.__name__, str(e)))
                log.exception(f"Error in handler '{handler.__name__}': {e}")

        if handler_errors:
            log.error(
                f"Event {event.event_id} had {len(handler_errors)} handler errors: {handler_errors}"
            )
            return False

        return True

    async def start(self):
        """Start the polling loop with connection pooling and signal handling."""
        # Set up signal handlers
        self.shutdown_handler.setup_signal_handlers()

        delay = self.interval_min
        empty_cycles = 0

        # Start memory monitoring
        memory_monitor = MemoryMonitor(self.memory_limit_mb, self.memory_check_interval)
        memory_task = asyncio.create_task(memory_monitor.start())

        try:
            # Initialize database connection pool
            async with DatabaseConnectionPool() as db_pool:

                # Log initial pool health
                health_status = await db_pool.health_check()
                log.info("Initial pool health check", extra=health_status)

                while True:
                    # Check for shutdown signal first
                    if self.shutdown_handler.shutdown_requested():
                        log.info(
                            f"Shutdown signal received ({self.shutdown_handler.signal_received}), stopping poller..."
                        )
                        break

                    # Check for memory limit exceeded
                    if memory_monitor.restart_requested():
                        log.warning("Memory limit exceeded - initiating restart")
                        break

                    rows = await db_pool.fetch_and_lock_rows(self.batch_size)
                    if not rows:
                        log.info("No rows to process. Sleeping for %s seconds.", delay)
                        empty_cycles += 1
                        # Increase delay every 5 consecutive empty cycles
                        if empty_cycles % 5 == 0:
                            new_delay = min(delay * 2, self.interval_max)
                            log.info(
                                "No rows to process for %d cycles. Increasing delay from %s to %s seconds.",
                                empty_cycles,
                                delay,
                                new_delay,
                            )
                            delay = new_delay

                        # Use asyncio.wait_for with timeout to check for shutdown or restart
                        shutdown_tasks = [
                            asyncio.create_task(
                                self.shutdown_handler.wait_for_shutdown()
                            ),
                            asyncio.create_task(memory_monitor.wait_for_restart()),
                        ]

                        try:
                            done, pending = await asyncio.wait(
                                shutdown_tasks,
                                timeout=delay,
                                return_when=asyncio.FIRST_COMPLETED,
                            )

                            # Cancel any pending tasks
                            for task in pending:
                                task.cancel()
                                try:
                                    await task
                                except asyncio.CancelledError:
                                    pass

                            # Check what completed
                            if done:
                                # Either shutdown or restart was requested
                                if self.shutdown_handler.shutdown_requested():
                                    log.info("Shutdown signal received during sleep")
                                    break
                                elif memory_monitor.restart_requested():
                                    log.warning(
                                        "Memory limit exceeded during sleep - initiating restart"
                                    )
                                    break

                        except asyncio.TimeoutError:
                            # Normal timeout, continue processing
                            pass

                        continue

                    log.info("Processing %s rows.", len(rows))
                    empty_cycles = 0

                    # Reset delay and log if it was previously increased
                    if delay > self.interval_min:
                        log.info(
                            "Resetting delay from %s to %s seconds due to incoming events.",
                            delay,
                            self.interval_min,
                        )
                    delay = self.interval_min

                    # Process ALL claimed rows - but check for shutdown between batches
                    processed_ids = []
                    for i, row in enumerate(rows):
                        # Check for shutdown signal periodically during processing
                        if i % 10 == 0 and self.shutdown_handler.shutdown_requested():
                            log.info(
                                "Shutdown signal received during processing, finishing current batch..."
                            )

                        log.info(
                            "Processing row %s with event type %s.", row[0], row[2]
                        )

                        # Process event through all handlers
                        success = await self._process_event(row)

                        # Only mark as processed if all handlers succeeded
                        if success:
                            processed_ids.append(row[0])
                        else:
                            log.warning(
                                f"Skipping event {row[0]} due to handler errors"
                            )

                    if processed_ids:
                        await db_pool.mark_processed(processed_ids)
                        log.info("Processed %s rows.", len(processed_ids))

                    # Log pool statistics periodically
                    if len(rows) > 0:
                        pool_stats = await db_pool.get_pool_stats()
                        log.info("Pool statistics", extra=pool_stats)

                    # After processing batch, check if shutdown or restart was requested
                    if self.shutdown_handler.shutdown_requested():
                        log.info("Shutdown signal received, exiting gracefully...")
                        break

        except Exception as e:
            log.exception(f"Error in outbox poller: {e}")
            raise
        finally:
            # Cleanup: stop memory monitoring
            log.info("Cleaning up resources...")
            await memory_monitor.stop()
            if not memory_task.done():
                memory_task.cancel()
                try:
                    await memory_task
                except asyncio.CancelledError:
                    pass

        # If we reach here, check exit condition
        if memory_monitor.restart_requested():
            log.info("Exiting for restart due to memory limit")
            sys.exit(RESTART_EXIT_CODE)
        elif self.shutdown_handler.shutdown_requested():
            log.info(
                f"Exiting gracefully due to {self.shutdown_handler.signal_received}"
            )
            sys.exit(0)


async def handle_row(event: OutboxEvent):
    """
    Handle a row from the outbox table.
    """
    poller_id = f"poller-{os.getpid()}"
    log.info(f"Publishing event for poller {poller_id}", extra=event.to_dict())
    # Get a publisher instance for this poller
    publisher = get_publisher(poller_id)
    # Publish the event
    success = publisher.publish_outbox_event(event)
    if not success:
        log.error("Failed to publish event", extra=event.to_dict())
        return False

    return True


class Command(BaseCommand):
    help = "Runs the memory-safe async outbox poller with connection pooling, signal handling, and auto-restart"

    def add_arguments(self, parser):
        parser.add_argument(
            "--memory-limit",
            type=int,
            default=MEMORY_LIMIT_MB,
            help="Memory limit in MB",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=BATCH_SIZE,
            help="Batch size",
        )
        parser.add_argument(
            "--interval-min",
            type=float,
            default=INTERVAL_MIN,
            help="Minimum interval in seconds",
        )
        parser.add_argument(
            "--interval-max",
            type=float,
            default=INTERVAL_MAX,
            help="Maximum interval in seconds",
        )
        parser.add_argument(
            "--memory-check-interval",
            type=int,
            default=MEMORY_CHECK_INTERVAL,
            help="Memory check interval in seconds",
        )

    def handle(self, *args, **options):
        batch_size = options["batch_size"]
        interval_min = options["interval_min"]
        interval_max = options["interval_max"]
        memory_limit_mb = options["memory_limit"]
        memory_check_interval = options["memory_check_interval"]

        try:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Starting outbox poller with connection pooling and signal handling:\n"
                    f"  - Batch size: {batch_size}\n"
                    f"  - Interval min: {interval_min}s\n"
                    f"  - Interval max: {interval_max}s\n"
                    f"  - Memory limit: {memory_limit_mb}MB\n"
                    f"  - Memory check interval: {memory_check_interval}s\n"
                    f"  - Pool size: {POOL_SIZE}\n"
                    f"  - Pool min size: {POOL_MIN_SIZE}\n"
                    f"  - Pool max size: {POOL_MAX_SIZE}\n"
                    f"  - Pool timeout: {POOL_TIMEOUT}s\n"
                    f"  - Pool max idle: {POOL_MAX_IDLE}s\n"
                    f"  - Pool max lifetime: {POOL_MAX_LIFETIME}s\n"
                    f"  - Graceful shutdown timeout: {GRACEFUL_SHUTDOWN_TIMEOUT}s"
                )
            )

            # Initialize the poller with the given configuration
            poller = OutboxPoller(
                batch_size=batch_size,
                interval_min=interval_min,
                interval_max=interval_max,
                memory_limit_mb=memory_limit_mb,
                memory_check_interval=memory_check_interval,
            )

            # Register the handler function to be invoked with each event
            poller.add_handler(handle_row)

            # Start the poller loop
            asyncio.run(poller.start())

        except SystemExit as e:
            if e.code == RESTART_EXIT_CODE:
                self.stdout.write(self.style.WARNING("Restarting outbox poller..."))
                os.execv(sys.executable, [sys.executable] + sys.argv)
            else:
                self.stdout.write(self.style.SUCCESS("Outbox poller shutdown complete"))
                sys.exit(e.code)
        except KeyboardInterrupt:
            # This should be rare now since we handle SIGINT properly
            self.stdout.write(
                self.style.WARNING("Keyboard interrupt received, shutting down...")
            )
            sys.exit(0)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Unexpected error: {e}"))
            log.exception(f"Unexpected error in outbox poller: {e}")
            sys.exit(1)
