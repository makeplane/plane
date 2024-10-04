# Python imports
import json
import secrets

# Django imports
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.conf import settings

# Module imports
from plane.license.models import Instance
from plane.db.models import (
    User,
    Workspace,
    Project,
    Issue,
    Module,
    Cycle,
    CycleIssue,
    ModuleIssue,
    Page,
)

from opentelemetry import trace

tracer = trace.get_tracer(__name__)


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument(
            "machine_signature", type=str, help="Machine signature"
        )

    def handle(self, *args, **options):
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then register this instance
        if instance is None:
            with open("package.json", "r") as file:
                # Load JSON content from the file
                data = json.load(file)

            machine_signature = options.get(
                "machine_signature", "machine-signature"
            )

            if not machine_signature:
                raise CommandError("Machine signature is required")

            payload = {
                "instance_key": settings.INSTANCE_KEY,
                "version": data.get("version", 0.1),
                "machine_signature": machine_signature,
                "user_count": User.objects.filter(is_bot=False).count(),
            }

            instance = Instance.objects.create(
                instance_name="Plane Community Edition",
                instance_id=secrets.token_hex(12),
                license_key=None,
                current_version=payload.get("version"),
                latest_version=payload.get("version"),
                last_checked_at=timezone.now(),
                user_count=payload.get("user_count", 0),
            )

            self.stdout.write(self.style.SUCCESS("Instance registered"))
        else:
            self.stdout.write(
                self.style.SUCCESS("Instance already registered")
            )

        if instance.is_telemetry_enabled:
            with tracer.start_as_current_span("instance_details") as span:
                workspace_count = Workspace.objects.count()
                user_count = User.objects.count()
                project_count = Project.objects.count()
                issue_count = Issue.objects.count()
                module_count = Module.objects.count()
                cycle_count = Cycle.objects.count()
                cycle_issue_count = CycleIssue.objects.count()
                module_issue_count = ModuleIssue.objects.count()
                page_count = Page.objects.count()

                span.set_attribute("instance_id", instance.instance_id)
                span.set_attribute("instance_name", instance.instance_name)
                span.set_attribute("current_version", instance.current_version)
                span.set_attribute("latest_version", instance.latest_version)
                span.set_attribute(
                    "is_telemetry_enabled", instance.is_telemetry_enabled
                )
                span.set_attribute("user_count", user_count)
                span.set_attribute("workspace_count", workspace_count)
                span.set_attribute("project_count", project_count)
                span.set_attribute("issue_count", issue_count)
                span.set_attribute("module_count", module_count)
                span.set_attribute("cycle_count", cycle_count)
                span.set_attribute("cycle_issue_count", cycle_issue_count)
                span.set_attribute("module_issue_count", module_issue_count)
                span.set_attribute("page_count", page_count)
