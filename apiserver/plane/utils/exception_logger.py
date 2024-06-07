# Python imports
import logging

# Third party imports
from sentry_sdk import capture_exception


def log_exception(e):
    print(e)
    # Log the error
    logger = logging.getLogger("plane")
    logger.error(e)

    # Capture in sentry if configured
    capture_exception(e)
    return
