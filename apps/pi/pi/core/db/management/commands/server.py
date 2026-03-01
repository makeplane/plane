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

import typer

from pi import logger

log = logger.getChild(__name__)

app = typer.Typer()


@app.command()
def runserver():
    """Run the FastAPI server"""
    try:
        from pi.app.main import run_server

        run_server()
    except Exception as e:
        log.error(f"Error: {e}")
        log.error("Please use: python -m pi.scripts.server runserver")


@app.command()
def start_application():
    """Wait for the database, apply migrations, sync LLMs, and start the server"""

    # For backward compatibility, still try to run
    try:
        # Import functions directly to avoid circular imports
        import asyncio
        import os
        import sys
        import time

        from alembic import command
        from alembic.config import Config
        from sqlalchemy import text
        from sqlalchemy.exc import OperationalError

        from pi.core.db.fixtures import sync_llms
        from pi.core.db.plane_pi.engine import sync_engine
        from pi.core.db.plane_pi.lifecycle import init_async_db

        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

        def wait_for_db(timeout: int = 60):
            log.info("Waiting for the database to be available...")
            start_time = time.time()
            while True:
                try:
                    with sync_engine.connect() as connection:
                        connection.execute(text("SELECT 1"))
                    log.info("Database connection established!")
                    return
                except OperationalError:
                    if time.time() - start_time > timeout:
                        log.error("Database connection timed out.")
                        sys.exit(1)
                    log.info("Database not available, retrying in 2 seconds...")
                    time.sleep(2)

        def wait_for_migrations():
            log.info("Applying migrations (if there are any pending)...")
            alembic_cfg = Config(os.path.join(BASE_DIR, "alembic.ini"))
            alembic_cfg.set_main_option("script_location", os.path.join(BASE_DIR, "alembic"))
            command.upgrade(alembic_cfg, "head")
            log.info("Migrations applied successfully!")

        def sync_llms_fixture():
            async def run():
                await init_async_db()
                await sync_llms()

            asyncio.run(run())

        wait_for_db()
        wait_for_migrations()
        sync_llms_fixture()

        from pi.app.main import run_server

        run_server()
    except Exception as e:
        log.error(f"Error: {e}")
        log.error("Please use: python -m pi.scripts.server start-application")
