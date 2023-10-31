from .base import BaseAPIView


class CycleAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to cycle.

    """

    pass


class CycleIssueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to cycle issues.

    """

    pass


class TransferCycleIssueAPIEndpoint(BaseAPIView):
    """
    This viewset provides `create` actions for transfering the issues into a particular cycle.

    """

    pass
