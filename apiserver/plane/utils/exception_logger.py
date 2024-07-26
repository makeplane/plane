# Python imports
import logging
import traceback

# Django imports
from django.conf import settings

# Third party imports
from sentry_sdk import capture_exception


def log_exception(e):
    # Log the error
    logger = logging.getLogger("plane")
    logger.error(e)

    if settings.DEBUG:
        # Print the traceback if in debug mode
        print(traceback.format_exc())

    # Capture in sentry if configured
    capture_exception(e)
    return
