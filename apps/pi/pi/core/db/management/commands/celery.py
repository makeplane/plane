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

import subprocess
import sys

import typer

from pi.celery_app import trigger_live_sync

app = typer.Typer()


@app.command("celery-worker")
def run_celery_worker(
    concurrency: int = typer.Option(2, "--concurrency", "-c", help="Number of concurrent worker processes"),
    queue: str = typer.Option("celery", "--queue", "-Q", help="Queue to consume from"),
    loglevel: str = typer.Option("info", "--loglevel", "-l", help="Log level (debug, info, warning, error)"),
):
    """Run Celery worker for background tasks."""
    cmd = [
        sys.executable,
        "-m",
        "celery",
        "-A",
        "pi.celery_app.celery_app",
        "worker",
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


@app.command("celery-beat")
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


@app.command("celery-flower")
def run_celery_flower(
    port: int = typer.Option(5555, "--port", "-p", help="Port to run Flower on"),
    address: str = typer.Option("0.0.0.0", "--address", "-a", help="Address to bind to"),
):
    """Run Celery Flower for monitoring tasks."""
    cmd = [
        sys.executable,
        "-m",
        "celery",
        "-A",
        "pi.celery_app.celery_app",
        "flower",
        "--port",
        str(port),
        "--address",
        address,
    ]

    typer.echo(f'Starting Celery Flower with command: {" ".join(cmd)}')
    typer.echo(f"Flower will be available at http://{address}:{port}")
    subprocess.run(cmd)


@app.command("test-vector-sync")
def test_vector_sync():
    """Test the vector processing task manually."""
    typer.echo("Running vector processing task...")
    try:
        result = trigger_live_sync.delay()
        typer.echo(f"Task submitted with ID: {result.id}")
        typer.echo("Check Celery worker logs for task execution details.")
    except Exception as e:
        typer.echo(f"Error submitting task: {e}")
