"""
Database routing utilities for read replica selection.
This module provides request-scoped context management for database routing,
specifically for determining when to use read replicas vs primary database.
Used in conjunction with middleware and DRF views that set use_read_replica=True.
The context is maintained per request to ensure proper isolation between
concurrent requests in async environments.
"""

from asgiref.local import Local

__all__ = [
    "set_use_read_replica",
    "should_use_read_replica",
    "clear_read_replica_context",
]

# Request-scoped context storage for database routing preferences
# Uses asgiref.local.Local which provides ContextVar under the hood
# This ensures proper context isolation per request in async environments
_db_routing_context = Local()


def set_use_read_replica(use_replica: bool) -> None:
    """
    Mark the current request context to use read replica database.
    This function sets a request-scoped flag that determines database routing.
    The context is isolated per request to ensure thread safety in async environments.
    This function is typically called from:
    - Middleware that detects read-only operations
    - DRF views with use_read_replica=True attribute
    - API endpoints that only perform read operations
    Args:
        use_replica (bool): True to route database queries to read replica,
                           False to use primary database
    Note:
        The context is automatically isolated per request and should be
        cleared at the end of each request using clear_read_replica_context().
    """
    _db_routing_context.use_read_replica = bool(use_replica)


def should_use_read_replica() -> bool:
    """
    Check if the current request should use read replica database.
    This function reads the request-scoped context to determine database routing.
    It's called by the database router to decide which connection to use.
    Returns:
        bool: True if queries should be routed to read replica,
              False if they should use primary database (default)
    Note:
        Returns False by default if no context is set for the current request.
        The context is automatically isolated per request.
    """
    return getattr(_db_routing_context, "use_read_replica", False)


def clear_read_replica_context() -> None:
    """
    Clear the read replica context for the current request.
    This function should be called at the end of each request to ensure
    that context doesn't leak between requests. Typically called from
    middleware during request cleanup.
    This is important for:
    - Preventing context leakage between requests
    - Ensuring clean state for each new request
    - Proper memory management in long-running processes
    """
    try:
        delattr(_db_routing_context, "use_read_replica")
    except AttributeError:
        pass
