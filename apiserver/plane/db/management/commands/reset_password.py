# Python imports
import getpass

# Django imports
from django.core.management import BaseCommand, CommandError

# Third party imports
from zxcvbn import zxcvbn

# Module imports
from plane.db.models import User


class Command(BaseCommand):
    help = "Reset password of the user with the given email"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("email", type=str, help="user email")

    def handle(self, *args, **options):
        # get the user email from console
        email = options.get("email", False)

        # raise error if email is not present
        if not email:
            self.stderr.write("Error: Email is required")
            return

        # filter the user
        user = User.objects.filter(email=email).first()

        # Raise error if the user is not present
        if not user:
            self.stderr.write(f"Error: User with {email} does not exists")
            return

        # get password for the user
        password = getpass.getpass("Password: ")
        confirm_password = getpass.getpass("Password (again): ")

        # If the passwords doesn't match raise error
        if password != confirm_password:
            self.stderr.write("Error: Your passwords didn't match.")
            return

        # Blank passwords should not be allowed
        if password.strip() == "":
            self.stderr.write("Error: Blank passwords aren't allowed.")
            return

        results = zxcvbn(password)

        if results["score"] < 3:
            raise CommandError("Password is too common please set a complex password")

        # Set user password
        user.set_password(password)
        user.is_password_autoset = False
        user.save()

        self.stdout.write(self.style.SUCCESS("User password updated succesfully"))
