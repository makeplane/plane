# Django imports
from django.contrib.auth import get_user

from typing import Any, Dict, Optional
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Third-Party Imports
from asgiref.sync import sync_to_async

# Strawberry imports
from strawberry.django.views import AsyncGraphQLView
from strawberry.types import ExecutionResult
from strawberry.types.execution import ExecutionContext


@method_decorator(csrf_exempt, name="dispatch")
class CustomGraphQLView(AsyncGraphQLView):
    async def get_context(self, request, response):
        # Get the user
        user = await sync_to_async(get_user)(request)

        # Add the user to the context
        context = await super().get_context(request, response)
        context.user = user
        return context

    async def process_result(
        self,
        request: Any,
        result: ExecutionResult,
        context: Optional[ExecutionContext] = None,
    ) -> Dict[str, Any]:
        processed_result = {
            "data": result.data,
        }

        if result.errors:
            processed_result["errors"] = [
                {
                    "message": error.message,
                    "extensions": error.extensions or {},
                }
                for error in result.errors
            ]

        return processed_result
