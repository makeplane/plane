#!/usr/bin/env python3
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

"""
Celery Runner Entry Point
This script handles all Celery operations and deliberately avoids FastAPI imports.
"""

import subprocess
import sys

import typer

from pi.config import settings

app = typer.Typer()


@app.command("worker")
def run_celery_worker(
    concurrency: int = typer.Option(2, "--concurrency", "-c", help="Number of concurrent worker processes"),
    queue: str = typer.Option(settings.celery.DEFAULT_QUEUE, "--queue", "-Q", help="Queue to consume from"),
    loglevel: str = typer.Option("info", "--loglevel", "-l", help="Log level (debug, info, warning, error)"),
    pool: str = typer.Option("prefork", "--pool", "-P", help="Pool type (prefork, threads, solo, eventlet, gevent)"),
):
    """Run Celery worker for background tasks."""
    cmd = [
        sys.executable,
        "-m",
        "celery",
        "-A",
        "pi.celery_app:celery_app",  # colon form
        "worker",
        "--pool",
        pool,  # Use the pool type from parameter
        "--concurrency",
        str(concurrency),
        "--queues",
        queue,
        "--loglevel",
        loglevel,
        "--without-heartbeat",
        "--without-gossip",
    ]

    typer.echo(f'Starting Celery worker with command: {" ".join(cmd)}')
    subprocess.run(cmd)


@app.command("beat")
def run_celery_beat(
    loglevel: str = typer.Option("info", "--loglevel", "-l", help="Log level (debug, info, warning, error)"),
    schedule_file: str = typer.Option("celerybeat-schedule", "--schedule", "-s", help="Path to schedule database file"),
):
    """Run Celery Beat scheduler for periodic tasks."""
    cmd = [
        sys.executable,
        "-m",
        "celery",
        "-A",
        "pi.celery_app.celery_app",
        "beat",
        "--loglevel",
        loglevel,
        "--schedule",
        schedule_file,
    ]

    typer.echo(f'Starting Celery Beat with command: {" ".join(cmd)}')
    subprocess.run(cmd)


if __name__ == "__main__":
    app()
