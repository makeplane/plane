# Python imports
import pytz
from datetime import datetime, date

# Third-party imports
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist

# Module imports
from plane.db.models import User


async def user_timezone_converter(user, input_date=None):
    if user is None or input_date is None:
        return None

    try:
        current_user = await sync_to_async(User.objects.get)(id=user.id)
    except ObjectDoesNotExist:
        return input_date

    user_timezone = current_user.user_timezone
    if not user_timezone:
        return input_date

    try:
        tz = pytz.timezone(user_timezone)
    except pytz.UnknownTimeZoneError:
        return input_date

    # Ensure input_date is datetime or date
    if isinstance(input_date, datetime):
        converted_date = input_date.astimezone(tz)
    elif isinstance(input_date, date):
        converted_date = datetime.combine(input_date, datetime.min.time()).astimezone(
            tz
        )
    else:
        return input_date

    return converted_date
