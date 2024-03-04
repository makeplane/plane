from plane.app.views.auth.adapter.base import Adapter


class CredentialAdapter(Adapter):
    """Common interface for all credential providers"""

    def __init__(self, request, provider):
        self.request = request
        self.provider = provider
        self.token_data = None
        self.user_data = None

    def authenticate(self):
        raise NotImplementedError
