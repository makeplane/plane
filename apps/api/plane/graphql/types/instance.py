# Strawberry imports
import strawberry_django

# Module Imports
from plane.license.models import Instance


@strawberry_django.type(Instance)
class InstanceType:
    instance_name: str
    current_version: str
    latest_version: str
