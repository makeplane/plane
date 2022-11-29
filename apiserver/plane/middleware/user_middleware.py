import jwt
import pytz
from django.conf import settings
from django.utils import timezone
from plane.db.models import User


class UserMiddleware(object):

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):

        try:
            if request.headers.get("Authorization"):
                authorization_header = request.headers.get("Authorization")
                access_token = authorization_header.split(" ")[1]
                decoded = jwt.decode(
                    access_token, settings.SECRET_KEY, algorithms=["HS256"]
                )
                id = decoded['user_id']
                user = User.objects.get(id=id)
                user.last_active = timezone.now()
                user.token_updated_at = None
                user.save()
                timezone.activate(pytz.timezone(user.user_timezone))
        except Exception as e:
            print(e)
        
        response = self.get_response(request)

        return response
