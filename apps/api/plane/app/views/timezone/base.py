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

    @method_decorator(cache_page(60 * 60 * 2))
    def get(self, request):
        timezone_locations = [
            ("Midway Island", "Pacific/Midway"),  # UTC-11:00
            ("American Samoa", "Pacific/Pago_Pago"),  # UTC-11:00
            ("Hawaii", "Pacific/Honolulu"),  # UTC-10:00
            ("Aleutian Islands", "America/Adak"),  # UTC-10:00 (DST: UTC-09:00)
            ("Marquesas Islands", "Pacific/Marquesas"),  # UTC-09:30
            ("Alaska", "America/Anchorage"),  # UTC-09:00 (DST: UTC-08:00)
            ("Gambier Islands", "Pacific/Gambier"),  # UTC-09:00
            (
                "Pacific Time (US and Canada)",
                "America/Los_Angeles",
            ),  # UTC-08:00 (DST: UTC-07:00)
            ("Baja California", "America/Tijuana"),  # UTC-08:00 (DST: UTC-07:00)
            (
                "Mountain Time (US and Canada)",
                "America/Denver",
            ),  # UTC-07:00 (DST: UTC-06:00)
            ("Arizona", "America/Phoenix"),  # UTC-07:00
            ("Chihuahua, Mazatlan", "America/Chihuahua"),  # UTC-07:00 (DST: UTC-06:00)
            (
                "Central Time (US and Canada)",
                "America/Chicago",
            ),  # UTC-06:00 (DST: UTC-05:00)
            ("Saskatchewan", "America/Regina"),  # UTC-06:00
            (
                "Guadalajara, Mexico City, Monterrey",
                "America/Mexico_City",
            ),  # UTC-06:00 (DST: UTC-05:00)
            ("Tegucigalpa, Honduras", "America/Tegucigalpa"),  # UTC-06:00
            ("Costa Rica", "America/Costa_Rica"),  # UTC-06:00
            (
                "Eastern Time (US and Canada)",
                "America/New_York",
            ),  # UTC-05:00 (DST: UTC-04:00)
            ("Lima", "America/Lima"),  # UTC-05:00
            ("Bogota", "America/Bogota"),  # UTC-05:00
            ("Quito", "America/Guayaquil"),  # UTC-05:00
            ("Chetumal", "America/Cancun"),  # UTC-05:00 (DST: UTC-04:00)
            ("Caracas (Old Venezuela Time)", "America/Caracas"),  # UTC-04:30
            ("Atlantic Time (Canada)", "America/Halifax"),  # UTC-04:00 (DST: UTC-03:00)
            ("Caracas", "America/Caracas"),  # UTC-04:00
            ("Santiago", "America/Santiago"),  # UTC-04:00 (DST: UTC-03:00)
            ("La Paz", "America/La_Paz"),  # UTC-04:00
            ("Manaus", "America/Manaus"),  # UTC-04:00
            ("Georgetown", "America/Guyana"),  # UTC-04:00
            ("Bermuda", "Atlantic/Bermuda"),  # UTC-04:00 (DST: UTC-03:00)
            (
                "Newfoundland Time (Canada)",
                "America/St_Johns",
            ),  # UTC-03:30 (DST: UTC-02:30)
            ("Buenos Aires", "America/Argentina/Buenos_Aires"),  # UTC-03:00
            ("Brasilia", "America/Sao_Paulo"),  # UTC-03:00
            ("Greenland", "America/Godthab"),  # UTC-03:00 (DST: UTC-02:00)
            ("Montevideo", "America/Montevideo"),  # UTC-03:00
            ("Falkland Islands", "Atlantic/Stanley"),  # UTC-03:00
            (
                "South Georgia and the South Sandwich Islands",
                "Atlantic/South_Georgia",
            ),  # UTC-02:00
            ("Azores", "Atlantic/Azores"),  # UTC-01:00 (DST: UTC+00:00)
            ("Cape Verde Islands", "Atlantic/Cape_Verde"),  # UTC-01:00
            ("Dublin", "Europe/Dublin"),  # UTC+00:00 (DST: UTC+01:00)
            ("Reykjavik", "Atlantic/Reykjavik"),  # UTC+00:00
            ("Lisbon", "Europe/Lisbon"),  # UTC+00:00 (DST: UTC+01:00)
            ("Monrovia", "Africa/Monrovia"),  # UTC+00:00
            ("Casablanca", "Africa/Casablanca"),  # UTC+00:00 (DST: UTC+01:00)
            (
                "Central European Time (Berlin, Rome, Paris)",
                "Europe/Paris",
            ),  # UTC+01:00 (DST: UTC+02:00)
            ("West Central Africa", "Africa/Lagos"),  # UTC+01:00
            ("Algiers", "Africa/Algiers"),  # UTC+01:00
            ("Lagos", "Africa/Lagos"),  # UTC+01:00
            ("Tunis", "Africa/Tunis"),  # UTC+01:00
            (
                "Eastern European Time (Cairo, Helsinki, Kyiv)",
                "Europe/Kyiv",
            ),  # UTC+02:00 (DST: UTC+03:00)
            ("Athens", "Europe/Athens"),  # UTC+02:00 (DST: UTC+03:00)
            ("Jerusalem", "Asia/Jerusalem"),  # UTC+02:00 (DST: UTC+03:00)
            ("Johannesburg", "Africa/Johannesburg"),  # UTC+02:00
            ("Harare, Pretoria", "Africa/Harare"),  # UTC+02:00
            ("Moscow Time", "Europe/Moscow"),  # UTC+03:00
            ("Baghdad", "Asia/Baghdad"),  # UTC+03:00
            ("Nairobi", "Africa/Nairobi"),  # UTC+03:00
            ("Kuwait, Riyadh", "Asia/Riyadh"),  # UTC+03:00
            ("Tehran", "Asia/Tehran"),  # UTC+03:30 (DST: UTC+04:30)
            ("Abu Dhabi", "Asia/Dubai"),  # UTC+04:00
            ("Baku", "Asia/Baku"),  # UTC+04:00 (DST: UTC+05:00)
            ("Yerevan", "Asia/Yerevan"),  # UTC+04:00 (DST: UTC+05:00)
            ("Astrakhan", "Europe/Astrakhan"),  # UTC+04:00
            ("Tbilisi", "Asia/Tbilisi"),  # UTC+04:00
            ("Mauritius", "Indian/Mauritius"),  # UTC+04:00
            ("Kabul", "Asia/Kabul"),  # UTC+04:30
            ("Islamabad", "Asia/Karachi"),  # UTC+05:00
            ("Karachi", "Asia/Karachi"),  # UTC+05:00
            ("Tashkent", "Asia/Tashkent"),  # UTC+05:00
            ("Yekaterinburg", "Asia/Yekaterinburg"),  # UTC+05:00
            ("Maldives", "Indian/Maldives"),  # UTC+05:00
            ("Chagos", "Indian/Chagos"),  # UTC+05:00
            ("Chennai", "Asia/Kolkata"),  # UTC+05:30
            ("Kolkata", "Asia/Kolkata"),  # UTC+05:30
            ("Mumbai", "Asia/Kolkata"),  # UTC+05:30
            ("New Delhi", "Asia/Kolkata"),  # UTC+05:30
            ("Sri Jayawardenepura", "Asia/Colombo"),  # UTC+05:30
            ("Kathmandu", "Asia/Kathmandu"),  # UTC+05:45
            ("Dhaka", "Asia/Dhaka"),  # UTC+06:00
            ("Almaty", "Asia/Almaty"),  # UTC+06:00
            ("Bishkek", "Asia/Bishkek"),  # UTC+06:00
            ("Thimphu", "Asia/Thimphu"),  # UTC+06:00
            ("Yangon (Rangoon)", "Asia/Yangon"),  # UTC+06:30
            ("Cocos Islands", "Indian/Cocos"),  # UTC+06:30
            ("Bangkok", "Asia/Bangkok"),  # UTC+07:00
            ("Hanoi", "Asia/Ho_Chi_Minh"),  # UTC+07:00
            ("Jakarta", "Asia/Jakarta"),  # UTC+07:00
            ("Novosibirsk", "Asia/Novosibirsk"),  # UTC+07:00
            ("Krasnoyarsk", "Asia/Krasnoyarsk"),  # UTC+07:00
            ("Beijing", "Asia/Shanghai"),  # UTC+08:00
            ("Singapore", "Asia/Singapore"),  # UTC+08:00
            ("Perth", "Australia/Perth"),  # UTC+08:00
            ("Hong Kong", "Asia/Hong_Kong"),  # UTC+08:00
            ("Ulaanbaatar", "Asia/Ulaanbaatar"),  # UTC+08:00
            ("Palau", "Pacific/Palau"),  # UTC+08:00
            ("Eucla", "Australia/Eucla"),  # UTC+08:45
            ("Tokyo", "Asia/Tokyo"),  # UTC+09:00
            ("Seoul", "Asia/Seoul"),  # UTC+09:00
            ("Yakutsk", "Asia/Yakutsk"),  # UTC+09:00
            ("Adelaide", "Australia/Adelaide"),  # UTC+09:30 (DST: UTC+10:30)
            ("Darwin", "Australia/Darwin"),  # UTC+09:30
            ("Sydney", "Australia/Sydney"),  # UTC+10:00 (DST: UTC+11:00)
            ("Brisbane", "Australia/Brisbane"),  # UTC+10:00
            ("Guam", "Pacific/Guam"),  # UTC+10:00
            ("Vladivostok", "Asia/Vladivostok"),  # UTC+10:00
            ("Tahiti", "Pacific/Tahiti"),  # UTC+10:00
            ("Lord Howe Island", "Australia/Lord_Howe"),  # UTC+10:30 (DST: UTC+11:00)
            ("Solomon Islands", "Pacific/Guadalcanal"),  # UTC+11:00
            ("Magadan", "Asia/Magadan"),  # UTC+11:00
            ("Norfolk Island", "Pacific/Norfolk"),  # UTC+11:00
            ("Bougainville Island", "Pacific/Bougainville"),  # UTC+11:00
            ("Chokurdakh", "Asia/Srednekolymsk"),  # UTC+11:00
            ("Auckland", "Pacific/Auckland"),  # UTC+12:00 (DST: UTC+13:00)
            ("Wellington", "Pacific/Auckland"),  # UTC+12:00 (DST: UTC+13:00)
            ("Fiji Islands", "Pacific/Fiji"),  # UTC+12:00 (DST: UTC+13:00)
            ("Anadyr", "Asia/Anadyr"),  # UTC+12:00
            ("Chatham Islands", "Pacific/Chatham"),  # UTC+12:45 (DST: UTC+13:45)
            ("Nuku'alofa", "Pacific/Tongatapu"),  # UTC+13:00
            ("Samoa", "Pacific/Apia"),  # UTC+13:00 (DST: UTC+14:00)
            ("Kiritimati Island", "Pacific/Kiritimati"),  # UTC+14:00
        ]

        timezone_list = []
        now = datetime.now()

        # Process timezone mapping
        for friendly_name, tz_identifier in timezone_locations:
            try:
                tz = pytz.timezone(tz_identifier)
                current_offset = now.astimezone(tz).strftime("%z")

                # converting and formatting UTC offset to GMT offset
                current_utc_offset = now.astimezone(tz).utcoffset()
                total_seconds = int(current_utc_offset.total_seconds())
                hours_offset = total_seconds // 3600
                minutes_offset = abs(total_seconds % 3600) // 60
                offset = f"{'+' if hours_offset >= 0 else '-'}{abs(hours_offset):02}:{minutes_offset:02}"

                timezone_value = {
                    "offset": int(current_offset),
                    "utc_offset": f"UTC{offset}",
                    "gmt_offset": f"GMT{offset}",
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
