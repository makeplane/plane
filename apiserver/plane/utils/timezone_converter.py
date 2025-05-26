# Python imports
import pytz
from datetime import datetime, time
from datetime import timedelta

# Django imports
from django.utils import timezone

# Module imports
from plane.db.models import Project


def user_timezone_converter(queryset, datetime_fields, user_timezone):
    # Create a timezone object for the user's timezone
    user_tz = pytz.timezone(user_timezone)

    # Check if queryset is a dictionary (single item) or a list of dictionaries
    if isinstance(queryset, dict):
        queryset_values = [queryset]
    else:
        queryset_values = list(queryset)

    # Iterate over the dictionaries in the list
    for item in queryset_values:
        # Iterate over the datetime fields
        for field in datetime_fields:
            # Convert the datetime field to the user's timezone
            if field in item and item[field]:
                item[field] = item[field].astimezone(user_tz)

    # If queryset was a single item, return a single item
    if isinstance(queryset, dict):
        return queryset_values[0]
    else:
        return queryset_values


def convert_to_utc(date, project_id, is_start_date=False):
    """
    Converts a start date string to the project's local timezone at 12:00 AM
    and then converts it to UTC for storage.

    Args:
        date (str): The date string in "YYYY-MM-DD" format.
        project_id (int): The project's ID to fetch the associated timezone.

    Returns:
        datetime: The UTC datetime.
    """
    # Retrieve the project's timezone using the project ID
    project = Project.objects.get(id=project_id)
    project_timezone = project.timezone
    if not date or not project_timezone:
        raise ValueError("Both date and timezone must be provided.")

    # Parse the string into a date object
    start_date = datetime.strptime(date, "%Y-%m-%d").date()

    # Get the project's timezone
    local_tz = pytz.timezone(project_timezone)

    # Combine the date with 12:00 AM time
    local_datetime = datetime.combine(start_date, time.min)

    # Localize the datetime to the project's timezone
    localized_datetime = local_tz.localize(local_datetime)

    # If it's an start date, add one minute
    if is_start_date:
        localized_datetime += timedelta(minutes=0, seconds=1)

        # Convert the localized datetime to UTC
        utc_datetime = localized_datetime.astimezone(pytz.utc)

        current_datetime_in_project_tz = timezone.now().astimezone(local_tz)
        current_datetime_in_utc = current_datetime_in_project_tz.astimezone(pytz.utc)

        if localized_datetime.date() == current_datetime_in_project_tz.date():
            return current_datetime_in_utc

        return utc_datetime
    else:
        # the cycle end date is the last minute of the day
        localized_datetime += timedelta(hours=23, minutes=59, seconds=0)

        # Convert the localized datetime to UTC
        utc_datetime = localized_datetime.astimezone(pytz.utc)

        # Return the UTC datetime for storage
        return utc_datetime


def convert_utc_to_project_timezone(utc_datetime, project_id):
    """
    Converts a UTC datetime (stored in the database) to the project's local timezone.

    Args:
        utc_datetime (datetime): The UTC datetime to be converted.
        project_id (int): The project's ID to fetch the associated timezone.

    Returns:
        datetime: The datetime in the project's local timezone.
    """
    # Retrieve the project's timezone using the project ID
    project = Project.objects.get(id=project_id)
    project_timezone = project.timezone
    if not project_timezone:
        raise ValueError("Project timezone must be provided.")

    # Get the timezone object for the project's timezone
    local_tz = pytz.timezone(project_timezone)

    # Convert the UTC datetime to the project's local timezone
    if utc_datetime.tzinfo is None:
        # Localize UTC datetime if it's naive (i.e., without timezone info)
        utc_datetime = pytz.utc.localize(utc_datetime)

    # Convert to the project's local timezone
    local_datetime = utc_datetime.astimezone(local_tz)

    return local_datetime
