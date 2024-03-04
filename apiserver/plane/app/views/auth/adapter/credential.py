from plane.app.views.auth.adapter.base import Adapter


class CredentialAdapter(Adapter):
    """Common interface for all credential providers"""

    def __init__(self, request, provider):
        super().__init__(request, provider)
        self.request = request
        self.provider = provider
