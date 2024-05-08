from rest_framework.authentication import SessionAuthentication


class BaseSessionAuthentication(SessionAuthentication):

    # Disable csrf for the rest apis
    def enforce_csrf(self, request):
        return
