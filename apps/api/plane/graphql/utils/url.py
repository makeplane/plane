# Python imports
import re


def contains_url(value: str) -> bool:
    url_pattern = re.compile(r"https?://|www\\.")
    return bool(url_pattern.search(value))
