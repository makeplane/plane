# Django imports
from django.core.management import BaseCommand, CommandError

# Module imports
from plane.db.models import User, Profile


class Command(BaseCommand):
    help = "Create the profile with the user email"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("email", type=str, help="user email")

    def handle(self, *args, **options):
        # get the user email from console
        email = options.get("email", False)

        # raise error if email is not present
        if not email:
            raise CommandError("Error: Email is required")

        # filter the user
        user = User.objects.filter(email=email).first()

        # Raise error if the user is not present
        if not user:
            raise CommandError(f"Error: User with {email} does not exists")

        # Activate the user
        profile, created = Profile.objects.get_or_create(user=user)

        if created:
            # Save the profile
            self.stdout.write(self.style.SUCCESS("User profile created succesfully"))
            return
        self.stdout.write(self.style.SUCCESS("User profile already exists"))
        return
