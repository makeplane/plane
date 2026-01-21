# Python imports
import pytz
from pytz.exceptions import UnknownTimeZoneError

# Module imports
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)


def validate_timezone(timezone_string):
    """
    Validate and return a timezone string.
    
    Args:
        timezone_string: String containing IANA timezone identifier (e.g., "America/New_York", "UTC")
    
    Returns:
        str: Validated timezone string, or "UTC" if invalid or None
    """
    if not timezone_string:
        return "UTC"
    
    timezone_string = str(timezone_string).strip()
    
    # Check if timezone is in pytz.all_timezones
    if timezone_string in pytz.all_timezones:
        return timezone_string
    
    # Try to get the timezone to validate it
    try:
        pytz.timezone(timezone_string)
        return timezone_string
    except UnknownTimeZoneError:
        # Invalid timezone, default to UTC
        return "UTC"

