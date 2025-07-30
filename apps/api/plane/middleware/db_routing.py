"""
Database routing middleware for read replica selection.
This middleware determines whether database queries should be routed to
read replicas or the primary database based on HTTP method and view configuration.
"""

import logging
from typing import Callable, Optional

from django.http import HttpRequest, HttpResponse

from plane.utils.core import (
    set_use_read_replica,
    clear_read_replica_context,
)

logger = logging.getLogger("plane.api")


class ReadReplicaRoutingMiddleware:
    """
    Middleware for intelligent database routing to read replicas.
    Routing Logic:
    • Non-GET requests (POST, PUT, DELETE, PATCH) ➜ Primary database
    • GET requests:
        - View has use_read_replica=False ➜ Primary database
        - View has use_read_replica=True ➜ Read replica
        - View has no use_read_replica attribute ➜ Primary database (safe default)
    The middleware supports both Django CBVs and DRF APIViews/ViewSets.
    Context is properly isolated per request to prevent data leakage.
    """

    # HTTP methods that are considered read-only by default
    READ_ONLY_METHODS = {"GET", "HEAD", "OPTIONS"}

    def __init__(self, get_response):
        """
        Initialize the middleware with the next middleware/view in the chain.
        Args:
            get_response: The next middleware or view function
        """
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """
        Process the request and determine database routing.
        Args:
            request: The HTTP request object
        Returns:
            HttpResponse: The HTTP response from the view
        """
        # For non-read operations, set primary database immediately
        if request.method not in self.READ_ONLY_METHODS:
            set_use_read_replica(False)
            logger.debug(f"Routing {request.method} {request.path} to primary database")

        try:
            # Process the request through the middleware chain
            response = self.get_response(request)
            return response
        finally:
            # Always clean up context, even if an exception occurs
            # This prevents context leakage between requests
            clear_read_replica_context()

    def process_view(
        self,
        request: HttpRequest,
        view_func: Callable,
        view_args: tuple,
        view_kwargs: dict,
    ) -> None:
        """
        Hook called just before Django calls the view.
        This is more efficient than resolving URLs in __call__ since Django
        provides the view function directly.
        Args:
            request: The HTTP request object
            view_func: The view function to be called
            view_args: Positional arguments for the view
            view_kwargs: Keyword arguments for the view
        """
        # Only process read operations (write operations already handled in __call__)
        if request.method in self.READ_ONLY_METHODS:
            use_replica = self._should_use_read_replica(view_func)
            set_use_read_replica(use_replica)

            db_type = "read replica" if use_replica else "primary database"
            logger.debug(f"Routing {request.method} {request.path} to {db_type}")

        # Return None to continue normal request processing
        return None

    def _should_use_read_replica(self, view_func: Callable) -> bool:
        """
        Determine if the view should use read replica based on its configuration.
        Args:
            view_func: The view function to inspect
        Returns:
            bool: True if should use read replica, False for primary database
        """
        use_replica_attr = self._get_use_replica_attribute(view_func)

        # Default to primary database for GET requests if no explicit setting
        # This ensures only views that explicitly opt-in use read replicas
        if use_replica_attr is None:
            return False

        return bool(use_replica_attr)

    def _get_use_replica_attribute(self, view_func: Callable) -> Optional[bool]:
        """
        Extract the use_read_replica attribute from various view types.
        Args:
            view_func: The view function to inspect
        Returns:
            Optional[bool]: The use_read_replica setting, or None if not found
        """
        # Return None if view_func is None to prevent AttributeError
        if view_func is None:
            return None

        # Check function-based view attribute
        use_replica = getattr(view_func, "use_read_replica", None)
        if use_replica is not None:
            return use_replica

        # Check Django CBV wrapper
        if hasattr(view_func, "view_class"):
            use_replica = getattr(view_func.view_class, "use_read_replica", None)
            if use_replica is not None:
                return use_replica

        # Check DRF wrapper (APIView / ViewSet)
        if hasattr(view_func, "cls"):
            use_replica = getattr(view_func.cls, "use_read_replica", None)
            if use_replica is not None:
                return use_replica

        return None

    def process_exception(self, request: HttpRequest, exception: Exception) -> None:
        """
        Handle exceptions that occur during view processing.
        This provides an additional safety net for context cleanup when views
        raise exceptions, complementing the try/finally in __call__.
        Args:
            request: The HTTP request object
            exception: The exception that was raised
        Returns:
            None: Don't handle the exception, just clean up context
        """
        # Clean up context on exception as a safety measure
        # The try/finally in __call__ should handle most cases, but this
        # provides extra protection specifically for view exceptions
        clear_read_replica_context()
        logger.debug(
            f"Cleaned up read replica context due to exception: {type(exception).__name__}"
        )

        # Return None to let the exception continue propagating
        return None
