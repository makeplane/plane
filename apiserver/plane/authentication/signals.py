# Django imports
from django.db.models.signals import post_save
from django.dispatch import receiver

# Module imports
from plane.ee.bgtasks.app_bot_task import add_app_bots_to_project
from plane.db.models.project import Project

from crum import get_current_user

@receiver(post_save, sender=Project)
def trigger_app_bots_to_project(sender, instance, created, **kwargs):
    """
    Signal handler to trigger a background task to add app bot users to a project.
    This offloads the processing to a background task for better performance.
    """
    if created:
        # Trigger the background task with the project id
        user = get_current_user()
        user_id = user.id if user and user.is_authenticated else None
        add_app_bots_to_project.delay(str(instance.id), user_id)
