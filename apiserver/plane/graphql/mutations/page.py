# # Strawberry imports
# import strawberry
# from strawberry.types import Info
# from strawberry.scalars import JSON
# from strawberry.permission import PermissionExtension

# # Third-party imports
# from asgiref.sync import sync_to_async
# from typing import Optional

# # Module imports
# from plane.graphql.permissions.workspace import WorkspaceBasePermission
# from plane.graphql.permissions.project import (
#     ProjectMemberPermission,
#     ProjectBasePermission,
#     ProjectAdminPermission,
# )
# from plane.graphql.types.project import ProjectType
# from plane.db.models import Workspace, Project, ProjectMember, UserFavorite


# @strawberry.type
# class PageMutation:

#     @strawberry.mutation(
#         extensions=[
#             PermissionExtension(permissions=[ProjectBasePermission()])
#         ]
#     )
#     async def createPage(
#         self,
#         info: Info,
#         slug: str,
#         name: str,
#         description: Optional[str] = "",
#     ) -> ProjectType:
#         page = await sync_to_async(Page.objects.create)(
#             name=name,
#             # identifier=identifier,
#             # network=network,
#             # description=description,
#             # project_lead=project_lead,
#             # logo_props=logo_props,
#             # projec=workspace,
#         )
#         # add the user as a admin of the project
#         _ = await sync_to_async(ProjectMember.objects.create)(
#             project=project,
#             member=info.context.user,
#             role=20,
#         )

#         return project
