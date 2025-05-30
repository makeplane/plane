# Django imports
from django.core.management.base import BaseCommand, CommandError

# Module imports
from plane.ee.models.template import Template


class Command(BaseCommand):
    """
    Management command to publish or unpublish a template to/from the marketplace.

    This command allows an admin to publish or unpublish a template, and set its verification status.

    Features:
    - Prompts the user to mark the template as verified or not when publishing.
    - Publishes the template by setting is_published to True.
    - Unpublishes the template by setting is_published to False.
    - Validates required fields before publishing: name, short_description, description_html,
      attachments, company_name, support_url, and categories.

    Example usage:
        python manage.py publish_template <template_id> --action=publish
        python manage.py publish_template <template_id> --action=unpublish

        # Example interactive session for publishing:
        $ python manage.py publish_template 123e4567-e89b-12d3-a456-426614174000 --action=publish
        Should the template be marked as is_verified? (y/n): y
        Template 123e4567-e89b-12d3-a456-426614174000 published successfully.

        # Example for unpublishing:
        $ python manage.py publish_template 123e4567-e89b-12d3-a456-426614174000 --action=unpublish
        Template 123e4567-e89b-12d3-a456-426614174000 unpublished successfully.

    Raises:
        CommandError: If the template does not exist or required fields are missing.
    """

    help = "Publish or unpublish a template to/from marketplace"

    def add_arguments(self, parser):
        # Positional argument
        parser.add_argument("template_id", type=str, help="Template Id")
        # Action argument
        parser.add_argument(
            "--action",
            type=str,
            default="publish",
            choices=["publish", "unpublish"],
            help="Action to perform (publish or unpublish)",
        )

    def validate_template_for_publishing(self, template):
        """Validate that all required fields are present for publishing"""
        required_fields = [
            "name",
            "short_description",
            "description_html",
            "attachments",
            "company_name",
            "categories",
        ]

        missing_fields = []

        for field in required_fields:
            value = getattr(template, field, None)
            if (
                value is None
                or value == ""
                or (isinstance(value, list) and len(value) == 0)
            ):
                missing_fields.append(field)

        return missing_fields

    def handle(self, *args, **options):
        try:
            # Get the template id and action
            template_id = options["template_id"]
            action = options["action"]

            # Get the template
            template = Template.objects.get(id=template_id)

            if action == "publish":
                # Validate required fields
                missing_fields = self.validate_template_for_publishing(template)
                if missing_fields:
                    missing_fields_str = ", ".join(missing_fields)
                    self.stdout.write(
                        self.style.ERROR((
                            "Template cannot be published. "
                            "The following required fields are missing: "
                            f"{missing_fields_str}"
                        ))
                    )
                    return

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
                    self.style.SUCCESS(
                        f"Template {template_id} published successfully."
                    )
                )
            elif action == "unpublish":
                template.is_published = False
                template.save()

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Template {template_id} unpublished successfully."
                    )
                )

        except Template.DoesNotExist:
            raise CommandError(f"Template with id {template_id} does not exist")
