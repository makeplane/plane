# Django imports
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.ee.models.template import Template
from plane.utils.uuid import is_valid_uuid
from plane.db.models.user import User

class Command(BaseCommand):

    """
    Management command to publish a template to the marketplace.

    This command allows an admin to mark a template as published, set its verification status

    Features:
    - Prompts the user to mark the template as verified or not.
    - Publishes the template by setting is_published to True.

    Example usage:
        python manage.py publish_template <template_id>

        # Example interactive session:
        $ python manage.py publish_template 123e4567-e89b-12d3-a456-426614174000
        Should the template be marked as is_verified? (y/n): y
        Template 123e4567-e89b-12d3-a456-426614174000 published successfully.

        # If you do not want to assign a made_by_id:
        $ python manage.py publish_template 123e4567-e89b-12d3-a456-426614174000
        Should the template be marked as is_verified? (y/n): n
        Template 123e4567-e89b-12d3-a456-426614174000 published successfully.

    Raises:
        CommandError: If the template does not exist.
    """



    help = "Publish a template to marketplace"


    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("template_id", type=str, help="Template Id")

    def handle(self, *args, **options):
        try:
            # Get the template id
            template_id = options["template_id"]

            # Get the template
            template = Template.objects.get(id=template_id)

            # Ask user if the template should be marked as is_verified
            is_verified_input = (
                input("Should the template be marked as is_verified? (y/n): ")
                .strip()
                .lower()
            )
            if is_verified_input == "y":
                template.is_verified = True
            elif is_verified_input == "n":
                template.is_verified = False
            else:
                self.stdout.write(
                    self.style.ERROR(
                        "Invalid input for is_verified. Please enter 'y' or 'n'."
                    )
                )
                return

            template.is_published = True
            template.save()

            self.stdout.write(
                self.style.SUCCESS(f"Template {template_id} published successfully.")
            )

        except Template.DoesNotExist:
            raise CommandError(f"Template with id {template_id} does not exist")
