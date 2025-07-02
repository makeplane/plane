from plane.silo.services.generate_application import create_applications
from celery import shared_task
from logging import getLogger

logger = getLogger("plane.silo.bgtasks")


@shared_task
def create_integration_applications(user_id: str):
    """
    Create all applications for the integrations
    """
    logger.info(
        f"Creating applications for instance after instance admin creation {user_id}"
    )
    create_applications(user_id)
    logger.info(f"Applications created for instance {user_id}")
    return
