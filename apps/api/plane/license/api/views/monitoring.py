# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework.response import Response

# Module imports
from plane.celery import app
from plane.db.models.notification import EmailNotificationLog
from plane.license.api.serializers.monitoring import (
    EmailNotificationLogSerializer,
)
from plane.license.api.views.base import BaseAPIView
from plane.utils.cache import cache_response


class EmailLogMonitoringEndpoint(BaseAPIView):
    """Paginated issue email notification logs for admin monitoring."""

    def get(self, request):
        queryset = EmailNotificationLog.objects.select_related(
            "receiver", "triggered_by"
        ).order_by("-created_at")

        # Apply optional filters
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        entity_name = request.query_params.get("entity_name")

        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        if entity_name:
            queryset = queryset.filter(entity_name=entity_name)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda results: EmailNotificationLogSerializer(
                results, many=True
            ).data,
            default_per_page=50,
            max_per_page=100,
        )


class ScheduledJobMonitoringEndpoint(BaseAPIView):
    """List all periodic tasks for admin monitoring (read-only)."""

    def get(self, request):
        from django_celery_beat.models import PeriodicTask

        tasks = PeriodicTask.objects.select_related(
            "crontab", "interval"
        ).order_by("name")

        results = []
        for task in tasks:
            # Build human-readable schedule display
            if task.crontab:
                schedule_display = str(task.crontab)
            elif task.interval:
                schedule_display = (
                    f"every {task.interval.every} {task.interval.period}"
                )
            else:
                schedule_display = "unknown"

            results.append(
                {
                    "id": task.id,
                    "name": task.name,
                    "task": task.task,
                    "schedule_display": schedule_display,
                    "enabled": task.enabled,
                    "last_run_at": task.last_run_at,
                    "total_run_count": task.total_run_count,
                }
            )

        return Response({"results": results}, status=200)


class WorkerHealthMonitoringEndpoint(BaseAPIView):
    """Live Celery worker stats via Inspect API, cached 30s."""

    @cache_response(30, user=False)
    def get(self, request):
        empty_response = {
            "workers": [],
            "summary": {"total_workers": 0, "total_active_tasks": 0},
        }

        try:
            inspector = app.control.inspect(timeout=3.0)
            active = inspector.active() or {}
            stats = inspector.stats() or {}
        except Exception:
            return Response(
                {**empty_response, "error": "Could not reach Celery workers"}
            )

        workers = []
        total_active = 0

        for worker_name in set(list(active.keys()) + list(stats.keys())):
            active_tasks = len(active.get(worker_name, []))
            total_active += active_tasks

            worker_stats = stats.get(worker_name, {})
            pool = worker_stats.get("pool", {})
            pool_impl = pool.get("implementation", "")
            pool_processes = len(pool.get("processes", []))
            pool_info = (
                f"{pool_impl} ({pool_processes} procs)"
                if pool_impl
                else None
            )

            # Calculate uptime from clock stats if available
            clock = worker_stats.get("clock", None)
            uptime = f"{clock} ticks" if clock else None

            workers.append(
                {
                    "name": worker_name,
                    "active_tasks": active_tasks,
                    "uptime": uptime,
                    "pool_info": pool_info,
                }
            )

        return Response(
            {
                "workers": workers,
                "summary": {
                    "total_workers": len(workers),
                    "total_active_tasks": total_active,
                },
            }
        )
