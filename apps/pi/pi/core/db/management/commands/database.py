# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import os
import sys
import time

import typer
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from pi import logger
from pi.core.db.plane_pi.engine import sync_engine

log = logger.getChild(__name__)

# Get base directory for alembic config
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

app = typer.Typer()


def get_alembic_config() -> Config:
    """Load Alembic configuration."""
    alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(BASE_DIR, "alembic"))
    return alembic_cfg


@app.command("wait-for-db")
def wait_for_db(timeout: int = 60):
    """
    Wait until the database connection is available.
    This command will block until a connection can be opened successfully
    or until the timeout is reached.
    """
    log.info("Waiting for the database to be available...")
    start_time = time.time()

    while True:
        try:
            with sync_engine.connect() as connection:
                # Execute a simple query to test the connection.
                connection.execute(text("SELECT 1"))
            log.info("Database connection established!")
            return
        except OperationalError:
            if time.time() - start_time > timeout:
                log.error("Database connection timed out.")
                sys.exit(1)
            log.info("Database not available, retrying in 2 seconds...")
            time.sleep(2)
        except Exception as e:
            log.error(f"Unexpected error while connecting to the database: {e}")
            sys.exit(1)


@app.command("wait-for-migrations")
def wait_for_migrations():
    """
    Apply all pending migrations using alembic upgrade head.
    """
    log.info("Applying migrations (if there are any pending)...")
    try:
        alembic_cfg = get_alembic_config()
        command.upgrade(alembic_cfg, "head")
        log.info("Migrations applied successfully!")
    except Exception as e:
        log.error(f"Migration failed: {e}")
        sys.exit(1)


@app.command()
def makemigrations(message: str = "auto"):
    """
    Generate migration scripts.
    """
    alembic_cfg = get_alembic_config()
    log.info("Generating migration script...")
    command.revision(alembic_cfg, message=message, autogenerate=True)
    log.info(f"Migration script created with message: {message}")


@app.command()
def migrate(revision: str = "head"):
    """
    Apply migrations.
    """
    alembic_cfg = get_alembic_config()
    log.info("Applying migrations...")
    command.upgrade(alembic_cfg, revision)
    log.info("Migrations applied successfully!")


@app.command()
def alembic_current():
    """Show the current Alembic revision applied to the database."""
    alembic_cfg = get_alembic_config()
    command.current(alembic_cfg)


@app.command()
def alembic_history():
    """Show the Alembic migration history."""
    alembic_cfg = get_alembic_config()
    command.history(alembic_cfg)


@app.command()
def alembic_downgrade(revision: str = "-1"):
    """Downgrade to a previous Alembic revision (default: -1 for last one)."""
    alembic_cfg = get_alembic_config()
    command.downgrade(alembic_cfg, revision)


@app.command("check-migrations")
def check_migrations():
    """
    Check for pending migrations and provide guidance.

    This command checks if there are any pending migrations and:
    - If no pending migrations: shows success message
    - If pending migrations exist: shows warning with helpful instructions

    Always exits with code 0 (server will continue to start).
    Useful for startup validation to inform users about database state.
    """
    try:
        from alembic.runtime.migration import MigrationContext
        from alembic.script import ScriptDirectory

        alembic_cfg = get_alembic_config()
        script = ScriptDirectory.from_config(alembic_cfg)

        # Get current database revision
        with sync_engine.connect() as connection:
            context = MigrationContext.configure(connection)
            current_heads = context.get_current_heads()

        # Get the latest revision from scripts
        script_heads = script.get_heads()

        # Check if there are pending migrations
        if set(current_heads) == set(script_heads):
            log.info("No pending migrations - database is up to date")
            typer.echo("Database is up to date - no pending migrations")
        else:
            # There are pending migrations - just report the difference
            log.warning("⚠ Pending migrations detected - server will start")
            typer.echo("")
            typer.echo("=" * 60)
            typer.echo("⚠  WARNING: Pending migration(s) detected")
            typer.echo("=" * 60)
            typer.echo("")
            typer.echo("Current database revision(s):")
            for rev_id in current_heads:
                typer.echo(f"  • {rev_id}")
            typer.echo("")
            typer.echo("Latest available revision(s):")
            for rev_id in script_heads:
                typer.echo(f"  • {rev_id}")
            typer.echo("")
            typer.echo("To apply pending migrations, run:")
            typer.echo("  python -m pi.manage migrate")
            typer.echo("")
            typer.echo("Or to see migration details:")
            typer.echo("  python -m pi.manage alembic-history")
            typer.echo("=" * 60)
            typer.echo("")
            typer.echo("Starting server ...")
            typer.echo("")

    except Exception as e:
        log.warning("Failed to check migrations (server will start): %s", e)
        typer.echo(f"⚠ Could not check migrations: {e}")
        typer.echo("Starting server ...")
        typer.echo("")


@app.command("bootstrap-db")
def bootstrap_db():
    """
    Bootstrap the database: wait for DB, apply migrations, and sync LLMs.
    """
    log.info("Starting database bootstrap process...")

    try:
        # Import here to avoid circular dependencies
        from pi.core.db.management.commands import llm

        # Wait for database to be available
        wait_for_db()

        # Apply migrations
        wait_for_migrations()

        # Sync LLM data
        llm.sync_llms_fixture()

        # Sync llm pricing data
        llm.sync_llm_pricing_fixture()

        log.info("Database bootstrap completed successfully!")
        sys.exit(0)

    except SystemExit as e:
        if e.code != 0:
            log.error(f"Bootstrap failed with exit code: {e.code}")
            sys.exit(1)
        else:
            # Re-raise the successful exit
            raise

    except Exception as e:
        log.error(f"Bootstrap failed with unexpected error: {e}")
        sys.exit(1)


@app.command("check-db-connectivity")
def check_db_connectivity():
    """
    Check PostgreSQL database connectivity.

    Tests the connection to PostgreSQL and displays database information.

    Example:
        python -m pi.manage check-db-connectivity
    """
    typer.echo("Checking PostgreSQL connectivity...")
    typer.echo("-" * 60)

    try:
        with sync_engine.connect() as connection:
            # Test basic connectivity with a simple query
            result = connection.execute(text("SELECT version()"))
            version = result.scalar()

            typer.echo("✓ PostgreSQL is reachable")
            typer.echo("")
            typer.echo("Database Information:")
            typer.echo(f"  Version: {version}")
            typer.echo("")

            # Get database name
            result = connection.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            typer.echo(f"  Database: {db_name}")

            # Get current user
            result = connection.execute(text("SELECT current_user"))
            db_user = result.scalar()
            typer.echo(f"  User: {db_user}")

        typer.echo("-" * 60)
        typer.echo("✓ PostgreSQL connectivity check PASSED")

        log.info("PostgreSQL connectivity check successful")

    except OperationalError as exc:
        log.error("PostgreSQL connectivity check failed: %s", exc, exc_info=True)
        typer.echo("-" * 60)
        typer.echo("✗ PostgreSQL connectivity check FAILED")
        typer.echo(f"Error: {exc}")
        typer.echo("")
        typer.echo("Please verify:")
        typer.echo("  - DATABASE_URL is correctly configured")
        typer.echo("  - PostgreSQL service is running")
        typer.echo("  - Database credentials are correct")
        typer.echo("  - Network connectivity is available")
        raise typer.Exit(code=1)

    except Exception as exc:
        log.error("Unexpected error during connectivity check: %s", exc, exc_info=True)
        typer.echo("-" * 60)
        typer.echo("✗ PostgreSQL connectivity check FAILED")
        typer.echo(f"Unexpected error: {exc}")
        raise typer.Exit(code=1)
