# Django imports
from django.core.management import BaseCommand, CommandError
from django.db import connection

# Module imports
from plane.db.models import User


class Command(BaseCommand):
    help = "Delete the user"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("--email", type=str, help="user email", required=True)

    def handle_lingering_constraints(self, user):
        """Delete the related objects from the blacklistedtoken and outstandingtoken tables"""
        with connection.cursor() as cursor:
            # First, delete entries from the blacklistedtoken table
            cursor.execute(
                """
                DELETE FROM token_blacklist_blacklistedtoken
                WHERE token_id IN (
                    SELECT id FROM token_blacklist_outstandingtoken
                    WHERE user_id = %s
                )
            """,
                [user.id],
            )

            # Then, delete entries from the outstandingtoken table
            cursor.execute(
                """
                DELETE FROM token_blacklist_outstandingtoken
                WHERE user_id = %s
            """,
                [user.id],
            )

    def handle(self, *args, **options):
        # get the user email from console
        email = options.get("email", False)

        # raise error if email is not present
        if not email:
            raise CommandError("Error: Email is required")

        # Fetch the user
        user = User.objects.filter(email=email).first()

        # Raise error if the user is not present
        if not user:
            raise CommandError(f"Error: User with {email} does not exists")

        # Delete the related objects
        self.handle_lingering_constraints(user)

        # Delete the user
        user.delete()

        # Print the success message
        self.stdout.write(self.style.SUCCESS("User deleted successfully"))
        return
