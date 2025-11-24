import random
import string


def get_random_color():
    """
    Get a random color in hex format
    """
    return "#" + "".join(random.choices(string.hexdigits, k=6))
