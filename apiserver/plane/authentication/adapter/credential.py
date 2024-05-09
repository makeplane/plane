from plane.authentication.adapter.base import Adapter


class CredentialAdapter(Adapter):
    """Common interface for all credential providers"""

    def __init__(self, request, provider):
        super().__init__(request, provider)
        self.request = request
        self.provider = provider

    def authenticate(self):
        self.set_user_data()
        return self.complete_login_or_signup()
