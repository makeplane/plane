from datetime import datetime

from django.utils import timezone


def get_issue_start_datetime(start_date, start_time):
    if start_date is None or start_time is None:
        return None

    current_timezone = timezone.get_current_timezone()
    localized_start_time = (
        timezone.localtime(start_time, current_timezone)
        if timezone.is_aware(start_time)
        else timezone.make_aware(start_time, current_timezone)
    )
    start_datetime = timezone.make_aware(
        datetime.combine(start_date, datetime.min.time()),
        current_timezone,
    )

    return start_datetime.replace(
        hour=localized_start_time.hour,
        minute=localized_start_time.minute,
        second=localized_start_time.second,
        microsecond=localized_start_time.microsecond,
    )


def is_issue_start_datetime_in_past(start_date, start_time):
    start_datetime = get_issue_start_datetime(start_date, start_time)
    if start_datetime is None:
        return False

    return start_datetime < timezone.now()
