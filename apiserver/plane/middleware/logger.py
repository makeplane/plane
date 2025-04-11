# Python imports
import logging
import time

# Django imports
from django.http import HttpRequest

# Third party imports
from rest_framework.request import Request

# Module imports
from plane.utils.ip_address import get_client_ip

api_logger = logging.getLogger("plane.api")


class RequestLoggerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def _should_log_route(self, request: Request | HttpRequest) -> bool:
        """
        Determines whether a route should be logged based on the request and status code.
        """
        # Don't log health checks
        if request.path == "/" and request.method == "GET":
            return False
        return True

    def __call__(self, request):
        # get the start time
        start_time = time.time()

        # Get the response
        response = self.get_response(request)

        # calculate the duration
        duration = time.time() - start_time

        # Check if logging is required
        log_true = self._should_log_route(request=request)

        # If logging is not required, return the response
        if not log_true:
            return response

        user_id = (
            request.user.id
            if getattr(request, "user")
            and getattr(request.user, "is_authenticated", False)
            else None
        )

        user_agent = request.META.get("HTTP_USER_AGENT", "")

        # Log the request information
        api_logger.info(
            f"{request.method} {request.get_full_path()} {response.status_code}",
            extra={
                "path": request.path,
                "method": request.method,
                "status_code": response.status_code,
                "duration_ms": int(duration * 1000),
                "remote_addr": get_client_ip(request),
                "user_agent": user_agent,
                "user_id": user_id,
            },
        )

        # return the response
        return response
