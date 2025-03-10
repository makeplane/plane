# Python imports
import json
from typing import Any, Dict, Optional

# Django imports
from django.http import JsonResponse
from django.http.request import HttpRequest
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Third-Party Imports
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

# Strawberry imports
from strawberry.django.views import AsyncGraphQLView
from strawberry.types import ExecutionResult, ExecutionContext


# Sync to async function to get the validated token
@sync_to_async
def get_validated_token(token):
    return JWTAuthentication().get_validated_token(token)


# Sync to async function to get the user
@sync_to_async
def get_jwt_user(validated_token):
    return JWTAuthentication().get_user(validated_token)


@method_decorator(csrf_exempt, name="dispatch")
class CustomGraphQLView(AsyncGraphQLView):
    async def get_context(self, request, response):
        # Get the context from the parent class
        context = await super().get_context(request, response)

        context.user = request.user
        return context

    async def dispatch(self, request: HttpRequest, *args: Any, **kwargs: Any):
        """Check if the request contains a public query/mutation before enforcing authentication."""
        try:
            body = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid request"}, status=400)

        query_name = self.get_query_name(body)
        if self.is_public_operation(query_name):
            return await super().dispatch(request, *args, **kwargs)

        # Authentication handling
        auth_header = request.headers.get("Authorization")
        request.user = None

        try:
            if auth_header:
                bearer_token = auth_header.split()[1]
                validated_token = await get_validated_token(bearer_token)
                user = await get_jwt_user(validated_token)
                if user:
                    request.user = user
                    return await super().dispatch(request, *args, **kwargs)
                else:
                    return JsonResponse(
                        {"message": "Authentication required"}, status=401
                    )
            else:
                return JsonResponse({"message": "Authentication required"}, status=401)
        except (InvalidToken, TokenError):
            return JsonResponse(
                {"message": "Invalid token. Please log in again."}, status=401
            )

    async def process_result(
        self,
        request: Any,
        result: ExecutionResult,
        context: Optional[ExecutionContext] = None,
    ) -> Dict[str, Any]:
        processed_result = {"data": result.data}

        if result.errors:
            processed_result["errors"] = [
                {"message": error.message, "extensions": error.extensions or {}}
                for error in result.errors
            ]

        return processed_result

    def get_query_name(self, body: dict) -> Optional[str]:
        query_str = body.get("query", "")
        first_line = query_str.strip().split("\n")[0]
        if first_line.startswith("query") or first_line.startswith("mutation"):
            return first_line.split("{")[0].split("(")[0].split()[-1]
        return None

    def is_public_operation(self, query_name: str) -> bool:
        auth_neglect_list = ["VersionCheckQuery", "InstanceQuery"]

        if query_name in auth_neglect_list:
            return True
        return False
