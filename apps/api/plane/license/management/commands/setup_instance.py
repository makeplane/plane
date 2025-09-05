# Python imports
import secrets
import uuid

# Django imports
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

# Module imports
from plane.license.models import Instance, InstanceAdmin, InstanceEdition
from plane.db.models import User, Profile


class Command(BaseCommand):
    help = "Check if instance in registered else register"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("admin_email", type=str, help="Admin Email")

    def handle(self, *args, **options):
        admin_email = options.get("admin_email", False)

        if not admin_email:
            raise CommandError("admin email is required")

        user = User.objects.filter(email=admin_email).first()
        if user is None:
            user = User.objects.create(
                email=admin_email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
            )
            _ = Profile.objects.create(user=user)

        try:
            # Check if the instance is registered
            instance = Instance.objects.first()

            if instance is None:
                instance = Instance.objects.create(
                    instance_name="Plane Cloud",
                    instance_id=secrets.token_hex(12),
                    current_version="latest",
                    latest_version="latest",
                    last_checked_at=timezone.now(),
                    is_verified=True,
                    is_setup_done=True,
                    is_signup_screen_visited=True,
                    edition=InstanceEdition.PLANE_CLOUD.value,
                )

            # Get or create an instance admin
            _, created = InstanceAdmin.objects.get_or_create(
                user=user, instance=instance, defaults={"role": 20, "is_verified": True}
            )

            if not created:
                self.stdout.write(
                    self.style.WARNING("given email is already an instance admin")
                )

            self.stdout.write(self.style.SUCCESS("Successful"))
        except Exception as e:
            print(e)
            raise CommandError("Failure")
