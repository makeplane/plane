# Python imports
import logging
import traceback

# Django imports
from django.conf import settings


def log_exception(e, warning=False):
    # Log the error
    logger = logging.getLogger("plane.exception")
    if warning:
        logger.warning(e)
    else:
        logger.exception(e)

    if settings.DEBUG:
        # Print the traceback if in debug mode
        print(traceback.format_exc())

    return
