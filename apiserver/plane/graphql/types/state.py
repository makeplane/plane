# Third-party library imports
from typing import Optional

# Strawberry Imports
import strawberry
import strawberry_django

# Django Imports
from asgiref.sync import sync_to_async

# Module imports
from plane.db.models import State


@sync_to_async
def get_group_states(project_id: str, state_group: str) -> list[State]:
    states = State.objects.filter(
        project_id=project_id, group=state_group, deleted_at__isnull=True
    ).order_by("sequence")

    return list(states)


@strawberry_django.type(State)
class StateType:
    id: strawberry.ID
    name: str
    description: str
    color: str
    slug: str
    sequence: float
    group: str
    is_triage: bool
    default: bool
    workspace: strawberry.ID
    project: strawberry.ID

    @strawberry.field
    def workspace(self) -> int:
        return self.workspace_id

    @strawberry.field
    def project(self) -> int:
        return self.project_id

    @strawberry.field
    async def order(self) -> Optional[float]:
        if self.group in ["started", "unstarted"]:
            project_id = self.project_id
            state_group = self.group

            group_states = await get_group_states(
                project_id=project_id, state_group=state_group
            )

            current_state_index = group_states.index(self) + 1
            group_states_count = len(group_states)

            return current_state_index / group_states_count

        return None
