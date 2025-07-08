from functools import wraps
from typing import Any, Callable


def public_query():
    def decorator(f: Callable) -> Callable:
        f._public = True

        @wraps(f)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            return f(*args, **kwargs)

        wrapper._public = True
        return wrapper

    return decorator
