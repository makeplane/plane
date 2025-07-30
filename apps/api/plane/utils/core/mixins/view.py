"""
Mixins for Django REST Framework views.
"""


class ReadReplicaControlMixin:
    """
    Mixin to control read replica usage in DRF views.
    Set use_read_replica = True/False to route read operations to
    replica/primary database. Works with ReadReplicaRoutingMiddleware.
    Usage:
        class MyViewSet(ReadReplicaControlMixin, ModelViewSet):
            use_read_replica = True  # Use replica for GET requests
    Note:
        - Only affects GET, HEAD, OPTIONS requests
        - Write operations always use primary database
        - Defaults to True for safe replica usage
    """

    use_read_replica: bool = True
