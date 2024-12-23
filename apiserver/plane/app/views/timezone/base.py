# Python imports
import pytz
from datetime import datetime

# Django imports
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

# Module imports
from plane.authentication.rate_limit import AuthenticationThrottle


class TimezoneEndpoint(APIView):
    permission_classes = [AllowAny]

    throttle_classes = [AuthenticationThrottle]

    @method_decorator(cache_page(60 * 60 * 24))
    def get(self, request):
        timezone_mapping = {
            "-1100": [
                ("Midway Island", "Pacific/Midway"),
                ("American Samoa", "Pacific/Pago_Pago"),
            ],
            "-1000": [
                ("Hawaii", "Pacific/Honolulu"),
                ("Aleutian Islands", "America/Adak"),
            ],
            "-0930": [("Marquesas Islands", "Pacific/Marquesas")],
            "-0900": [
                ("Alaska", "America/Anchorage"),
                ("Gambier Islands", "Pacific/Gambier"),
            ],
            "-0800": [
                ("Pacific Time (US and Canada)", "America/Los_Angeles"),
                ("Baja California", "America/Tijuana"),
            ],
            "-0700": [
                ("Mountain Time (US and Canada)", "America/Denver"),
                ("Arizona", "America/Phoenix"),
                ("Chihuahua, Mazatlan", "America/Chihuahua"),
            ],
            "-0600": [
                ("Central Time (US and Canada)", "America/Chicago"),
                ("Saskatchewan", "America/Regina"),
                ("Guadalajara, Mexico City, Monterrey", "America/Mexico_City"),
                ("Tegucigalpa, Honduras", "America/Tegucigalpa"),
                ("Costa Rica", "America/Costa_Rica"),
            ],
            "-0500": [
                ("Eastern Time (US and Canada)", "America/New_York"),
                ("Lima", "America/Lima"),
                ("Bogota", "America/Bogota"),
                ("Quito", "America/Guayaquil"),
                ("Chetumal", "America/Cancun"),
            ],
            "-0430": [("Caracas (Old Venezuela Time)", "America/Caracas")],
            "-0400": [
                ("Atlantic Time (Canada)", "America/Halifax"),
                ("Caracas", "America/Caracas"),
                ("Santiago", "America/Santiago"),
                ("La Paz", "America/La_Paz"),
                ("Manaus", "America/Manaus"),
                ("Georgetown", "America/Guyana"),
                ("Bermuda", "Atlantic/Bermuda"),
            ],
            "-0330": [("Newfoundland Time (Canada)", "America/St_Johns")],
            "-0300": [
                ("Buenos Aires", "America/Argentina/Buenos_Aires"),
                ("Brasilia", "America/Sao_Paulo"),
                ("Greenland", "America/Godthab"),
                ("Montevideo", "America/Montevideo"),
                ("Falkland Islands", "Atlantic/Stanley"),
            ],
            "-0200": [
                (
                    "South Georgia and the South Sandwich Islands",
                    "Atlantic/South_Georgia",
                )
            ],
            "-0100": [
                ("Azores", "Atlantic/Azores"),
                ("Cape Verde Islands", "Atlantic/Cape_Verde"),
            ],
            "+0000": [
                ("Dublin", "Europe/Dublin"),
                ("Reykjavik", "Atlantic/Reykjavik"),
                ("Lisbon", "Europe/Lisbon"),
                ("Monrovia", "Africa/Monrovia"),
                ("Casablanca", "Africa/Casablanca"),
            ],
            "+0100": [
                ("Central European Time (Berlin, Rome, Paris)", "Europe/Paris"),
                ("West Central Africa", "Africa/Lagos"),
                ("Algiers", "Africa/Algiers"),
                ("Lagos", "Africa/Lagos"),
                ("Tunis", "Africa/Tunis"),
            ],
            "+0200": [
                ("Eastern European Time (Cairo, Helsinki, Kyiv)", "Europe/Kiev"),
                ("Athens", "Europe/Athens"),
                ("Jerusalem", "Asia/Jerusalem"),
                ("Johannesburg", "Africa/Johannesburg"),
                ("Harare, Pretoria", "Africa/Harare"),
            ],
            "+0300": [
                ("Moscow Time", "Europe/Moscow"),
                ("Baghdad", "Asia/Baghdad"),
                ("Nairobi", "Africa/Nairobi"),
                ("Kuwait, Riyadh", "Asia/Riyadh"),
            ],
            "+0330": [("Tehran", "Asia/Tehran")],
            "+0400": [
                ("Abu Dhabi", "Asia/Dubai"),
                ("Baku", "Asia/Baku"),
                ("Yerevan", "Asia/Yerevan"),
                ("Astrakhan", "Europe/Astrakhan"),
                ("Tbilisi", "Asia/Tbilisi"),
                ("Mauritius", "Indian/Mauritius"),
            ],
            "+0500": [
                ("Islamabad", "Asia/Karachi"),
                ("Karachi", "Asia/Karachi"),
                ("Tashkent", "Asia/Tashkent"),
                ("Yekaterinburg", "Asia/Yekaterinburg"),
                ("Maldives", "Indian/Maldives"),
                ("Chagos", "Indian/Chagos"),
            ],
            "+0530": [
                ("Chennai", "Asia/Kolkata"),
                ("Kolkata", "Asia/Kolkata"),
                ("Mumbai", "Asia/Kolkata"),
                ("New Delhi", "Asia/Kolkata"),
                ("Sri Jayawardenepura", "Asia/Colombo"),
            ],
            "+0545": [("Kathmandu", "Asia/Kathmandu")],
            "+0600": [
                ("Dhaka", "Asia/Dhaka"),
                ("Almaty", "Asia/Almaty"),
                ("Bishkek", "Asia/Bishkek"),
                ("Thimphu", "Asia/Thimphu"),
            ],
            "+0630": [
                ("Yangon (Rangoon)", "Asia/Yangon"),
                ("Cocos Islands", "Indian/Cocos"),
            ],
            "+0700": [
                ("Bangkok", "Asia/Bangkok"),
                ("Hanoi", "Asia/Ho_Chi_Minh"),
                ("Jakarta", "Asia/Jakarta"),
                ("Novosibirsk", "Asia/Novosibirsk"),
                ("Krasnoyarsk", "Asia/Krasnoyarsk"),
            ],
            "+0800": [
                ("Beijing", "Asia/Shanghai"),
                ("Singapore", "Asia/Singapore"),
                ("Perth", "Australia/Perth"),
                ("Hong Kong", "Asia/Hong_Kong"),
                ("Ulaanbaatar", "Asia/Ulaanbaatar"),
                ("Palau", "Pacific/Palau"),
            ],
            "+0845": [("Eucla", "Australia/Eucla")],
            "+0900": [
                ("Tokyo", "Asia/Tokyo"),
                ("Seoul", "Asia/Seoul"),
                ("Yakutsk", "Asia/Yakutsk"),
            ],
            "+0930": [
                ("Adelaide", "Australia/Adelaide"),
                ("Darwin", "Australia/Darwin"),
            ],
            "+1000": [
                ("Sydney", "Australia/Sydney"),
                ("Brisbane", "Australia/Brisbane"),
                ("Guam", "Pacific/Guam"),
                ("Vladivostok", "Asia/Vladivostok"),
                ("Tahiti", "Pacific/Tahiti"),
            ],
            "+1030": [("Lord Howe Island", "Australia/Lord_Howe")],
            "+1100": [
                ("Solomon Islands", "Pacific/Guadalcanal"),
                ("Magadan", "Asia/Magadan"),
                ("Norfolk Island", "Pacific/Norfolk"),
                ("Bougainville Island", "Pacific/Bougainville"),
                ("Chokurdakh", "Asia/Srednekolymsk"),
            ],
            "+1200": [
                ("Auckland", "Pacific/Auckland"),
                ("Wellington", "Pacific/Auckland"),
                ("Fiji Islands", "Pacific/Fiji"),
                ("Anadyr", "Asia/Anadyr"),
            ],
            "+1245": [("Chatham Islands", "Pacific/Chatham")],
            "+1300": [("Nuku'alofa", "Pacific/Tongatapu"), ("Samoa", "Pacific/Apia")],
            "+1400": [("Kiritimati Island", "Pacific/Kiritimati")],
        }

        timezone_list = []
        now = datetime.now()

        # Process timezone mapping
        for offset, locations in timezone_mapping.items():
            sign = "-" if offset.startswith("-") else "+"
            hours = offset[1:3]
            minutes = offset[3:] if len(offset) > 3 else "00"

            for friendly_name, tz_identifier in locations:
                try:
                    tz = pytz.timezone(tz_identifier)
                    current_offset = now.astimezone(tz).strftime("%z")

                    # converting and formatting UTC offset to GMT offset
                    current_utc_offset = now.astimezone(tz).utcoffset()
                    total_seconds = int(current_utc_offset.total_seconds())
                    hours_offset = total_seconds // 3600
                    minutes_offset = abs(total_seconds % 3600) // 60
                    gmt_offset = (
                        f"GMT{'+' if hours_offset >= 0 else '-'}"
                        f"{abs(hours_offset):02}:{minutes_offset:02}"
                    )

                    timezone_value = {
                        "offset": int(current_offset),
                        "utc_offset": f"UTC{sign}{hours}:{minutes}",
                        "gmt_offset": gmt_offset,
                        "value": tz_identifier,
                        "label": f"{friendly_name}",
                    }

                    timezone_list.append(timezone_value)
                except pytz.exceptions.UnknownTimeZoneError:
                    continue

        # Sort by offset and then by label
        timezone_list.sort(key=lambda x: (x["offset"], x["label"]))

        # Remove offset from final output
        for tz in timezone_list:
            del tz["offset"]

        return Response({"timezones": timezone_list}, status=status.HTTP_200_OK)
