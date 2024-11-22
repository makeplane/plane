import pytz


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
