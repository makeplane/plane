# Python imports
import logging
import traceback

# Django imports
from django.conf import settings

# Third party imports
from sentry_sdk import capture_exception


def log_exception(e):
    print(e)
    # Log the error
    logger = logging.getLogger("plane")
    logger.error(e)

    # Log traceback if running in Debug
    if settings.DEBUG:
        logger.error(traceback.format_exc(e))

    # Capture in sentry if configured
    capture_exception(e)
    return
