from bs4 import BeautifulSoup
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

from django.conf import settings

from plane.utils.s3 import S3


def parse_text_to_html(html, features="html.parser"):
    return BeautifulSoup(html, features)


def refresh_url_content(html):
    date_format = "%Y%m%dT%H%M%SZ"
    refreshed = False

    s3 = S3()
    for img_tag in html.find_all("img"):
        old_src = img_tag["src"]
        parsed_url = urlparse(old_src)
        query_params = parse_qs(parsed_url.query)
        x_amz_date = query_params.get("X-Amz-Date", [None])[0]

        x_amz_date_to_date = datetime.strptime(x_amz_date, date_format).replace(
            tzinfo=timezone.utc
        )
        actual_date = datetime.now(timezone.utc)
        seconds_difference = (actual_date - x_amz_date_to_date).total_seconds()

        if seconds_difference >= (settings.AWS_S3_MAX_AGE_SECONDS - 20):
            new_url = s3.refresh_url(old_src)
            img_tag["src"] = new_url
            refreshed = True

    return refreshed, str(html)
