# Python imports
import logging
import traceback

# Django imports
from django.conf import settings


def log_exception(e, warning=False):
    # Log the error
    logger = logging.getLogger("plane.exception")

    if warning:
        logger.warning(str(e))
    else:
        logger.exception(e)

    if settings.DEBUG:
        logger.debug(traceback.format_exc())
    return
