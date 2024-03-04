
# Django imports
from django.core.exceptions import BadRequest

# Module imports
from plane.app.views.auth.adapter.base import Adapter
from plane.db.models import User


class EmailProvider(Adapter):

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

    def initiate(self):
        self.aut

    def set_user_data(self):
        user = User.objects.filter(
            email=self.key,
        ).first()
        
        if not user.check_password(self.code):
            raise BadRequest
        super().set_user_data({
            "email": self.key,
            "user": {
                "avatar": "",
                "first_name": "",
                "last_name": "",
                "provider_id": "",
            },
        })
        return user