# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.graphql.permissions.public import public_query
from plane.graphql.types.instance import InstanceType
from plane.license.models import Instance


@strawberry.type
class InstanceQuery:
    @strawberry.field
    @public_query()
    async def instance(self, info: Info) -> InstanceType:
        instance = await sync_to_async(Instance.objects.first)()

        if not instance:
            message = "Instance not found"
            error_extensions = {"code": "INSTANCE_NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)

        return instance
