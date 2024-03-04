# Django imports
from django.core.exceptions import BadRequest

# Module imports
from plane.app.views.auth.adapter.credential import CredentialAdapter
from plane.db.models import User


class EmailProvider(CredentialAdapter):

    provider = "email"

    def __init__(
        self,
        request,
        key=None,
        code=None,
    ):
        super().__init__(request, self.provider)
        self.key = key
        self.code = code

    def authenticate(self):
        user = self.set_user_data()
        return user, user.email

    def set_user_data(self):
        user = User.objects.filter(
            email=self.key,
        ).first()
        # Existing user
        if not user:
            raise BadRequest(
                "Sorry, we could not find a user with the provided credentials. Please try again."
            )

        # Check user password
        if not user.check_password(self.code):
            raise BadRequest(
                "Sorry, we could not find a user with the provided credentials. Please try again."
            )

        super().set_user_data(
            {
                "email": self.key,
                "user": {
                    "avatar": "",
                    "first_name": "",
                    "last_name": "",
                    "provider_id": "",
                },
            }
        )
        return user
