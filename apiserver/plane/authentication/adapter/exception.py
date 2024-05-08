from rest_framework.views import exception_handler
from rest_framework.exceptions import NotAuthenticated


def auth_exception_handler(exc, context):
    # Call the default exception handler first, to get the standard error response.
    response = exception_handler(exc, context)
    # Check if an AuthenticationFailed exception is raised.
    if isinstance(exc, NotAuthenticated):
        # Return 403 if the users me api fails
        request = context["request"]
        if request.path == "/api/users/me/":
            response.status_code = 403
        # else return 401
        else:
            response.status_code = 401

    return response
