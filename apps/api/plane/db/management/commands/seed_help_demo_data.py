# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Create an isolated demo workspace populated with sample data, used ONLY as the
backdrop for Help Center screenshots (so captures show realistic content, not
empty states).

Idempotent: re-running reuses the demo workspace and the screenshot user, and
skips re-seeding if the workspace already has projects (the underlying
`workspace_seed` is not itself idempotent). NEVER run against a real tenant — the
demo workspace slug is fixed and isolated; do not auto-run from migrations.

    python manage.py seed_help_demo_data
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.bgtasks.workspace_seed_task import workspace_seed
from plane.db.models import Dashboard, Profile, Project, User, Workspace, WorkspaceMember

DEMO_SLUG = "help-demo"
SHOT_EMAIL = "help-screenshot@shinhan.local"


class Command(BaseCommand):
    help = "Create/populate the isolated 'help-demo' workspace for Help Center screenshots."

    @transaction.atomic
    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            email=SHOT_EMAIL,
            defaults={"username": SHOT_EMAIL, "first_name": "Help", "last_name": "Screenshot", "is_active": True},
        )
        if not user.has_usable_password():
            user.set_unusable_password()
            user.save()

        # Grant instance-admin so God Mode (apps/admin) screenshots are reachable.
        self._ensure_instance_admin(user)

        workspace, created = Workspace.objects.get_or_create(
            slug=DEMO_SLUG, defaults={"name": "Help Demo", "owner": user}
        )
        WorkspaceMember.objects.get_or_create(
            workspace=workspace, member=user, defaults={"role": 20, "company_role": ""}
        )

        # The web app redirects to sign-in if /api/users/me/profile/ 404s, so the
        # ORM-created screenshot user needs an onboarded Profile to render the app.
        profile, _ = Profile.objects.get_or_create(
            user=user, defaults={"is_onboarded": True, "is_tour_completed": True}
        )
        if not profile.is_onboarded or profile.last_workspace_id != workspace.id:
            profile.is_onboarded = True
            profile.is_tour_completed = True
            profile.last_workspace_id = workspace.id
            profile.save()

        if Project.objects.filter(workspace=workspace).exists():
            self.stdout.write(self.style.WARNING(f"Demo workspace '{DEMO_SLUG}' already populated — skipping seed."))
        else:
            workspace_seed(workspace.id)  # projects, states, labels, issues, cycles, modules, pages, views
            self.stdout.write(self.style.SUCCESS(f"Seeded demo content into '{DEMO_SLUG}'."))

        # A demo Dashboard so the Custom Dashboards screenshots (list card + the
        # widget-config modal opened from its detail page) have a real target.
        self._ensure_demo_dashboard(workspace, user)

        self.stdout.write(
            self.style.SUCCESS(
                f"Help screenshot user: {SHOT_EMAIL} (id={user.id}); demo workspace: /{DEMO_SLUG}/"
            )
        )

    @staticmethod
    def _ensure_demo_dashboard(workspace, user):
        Dashboard.objects.get_or_create(
            workspace=workspace,
            name="Báo cáo công việc (mẫu)",
            defaults={
                "description": "Dashboard mẫu minh hoạ trong Trợ giúp",
                "access": 1,  # public — visible on the demo dashboards list
                "created_by": user,
                "updated_by": user,
            },
        )

    @staticmethod
    def _ensure_instance_admin(user):
        try:
            from plane.license.models import Instance, InstanceAdmin

            instance = Instance.objects.first()
            if instance:
                InstanceAdmin.objects.get_or_create(instance=instance, user=user, defaults={"role": 20})
        except Exception:
            # No instance configured (fresh setup) — God Mode shots can be captured later.
            pass
