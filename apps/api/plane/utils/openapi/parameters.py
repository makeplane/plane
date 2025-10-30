"""
Common OpenAPI parameters for drf-spectacular.

This module provides reusable parameter definitions that can be shared
across multiple API endpoints to ensure consistency.
"""

from drf_spectacular.utils import OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


# Path Parameters
WORKSPACE_SLUG_PARAMETER = OpenApiParameter(
    name="slug",
    description="Workspace slug",
    required=True,
    type=OpenApiTypes.STR,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example workspace",
            value="my-workspace",
            description="A typical workspace slug",
        )
    ],
)

PROJECT_ID_PARAMETER = OpenApiParameter(
    name="project_id",
    description="Project ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example project ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical project UUID",
        )
    ],
)

PROJECT_PK_PARAMETER = OpenApiParameter(
    name="pk",
    description="Project ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example project ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical project UUID",
        )
    ],
)

PROJECT_IDENTIFIER_PARAMETER = OpenApiParameter(
    name="project_identifier",
    description="Project identifier (unique string within workspace)",
    required=True,
    type=OpenApiTypes.STR,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example project identifier",
            value="PROJ",
            description="A typical project identifier",
        )
    ],
)

ISSUE_IDENTIFIER_PARAMETER = OpenApiParameter(
    name="issue_identifier",
    description="Issue sequence ID (numeric identifier within project)",
    required=True,
    type=OpenApiTypes.INT,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example issue identifier",
            value=123,
            description="A typical issue sequence ID",
        )
    ],
)

ASSET_ID_PARAMETER = OpenApiParameter(
    name="asset_id",
    description="Asset ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example asset ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical asset UUID",
        )
    ],
)

CYCLE_ID_PARAMETER = OpenApiParameter(
    name="cycle_id",
    description="Cycle ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example cycle ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical cycle UUID",
        )
    ],
)

MODULE_ID_PARAMETER = OpenApiParameter(
    name="module_id",
    description="Module ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example module ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical module UUID",
        )
    ],
)

MODULE_PK_PARAMETER = OpenApiParameter(
    name="pk",
    description="Module ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example module ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical module UUID",
        )
    ],
)

ISSUE_ID_PARAMETER = OpenApiParameter(
    name="issue_id",
    description="Issue ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example issue ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical issue UUID",
        )
    ],
)

STATE_ID_PARAMETER = OpenApiParameter(
    name="state_id",
    description="State ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example state ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical state UUID",
        )
    ],
)

# Additional Path Parameters
LABEL_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Label ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example label ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical label UUID",
        )
    ],
)

COMMENT_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Comment ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example comment ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical comment UUID",
        )
    ],
)

LINK_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Link ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example link ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical link UUID",
        )
    ],
)

ATTACHMENT_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Attachment ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example attachment ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical attachment UUID",
        )
    ],
)

ACTIVITY_ID_PARAMETER = OpenApiParameter(
    name="pk",
    description="Activity ID",
    required=True,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    examples=[
        OpenApiExample(
            name="Example activity ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical activity UUID",
        )
    ],
)

# Query Parameters
CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Pagination cursor for getting next set of results",
    required=False,
    examples=[
        OpenApiExample(
            name="Next page cursor",
            value="20:1:0",
            description="Cursor format: 'page_size:page_number:offset'",
        )
    ],
)

PER_PAGE_PARAMETER = OpenApiParameter(
    name="per_page",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.QUERY,
    description="Number of results per page (default: 20, max: 100)",
    required=False,
    examples=[
        OpenApiExample(name="Default", value=20),
        OpenApiExample(name="Maximum", value=100),
    ],
)

# External Integration Parameters
EXTERNAL_ID_PARAMETER = OpenApiParameter(
    name="external_id",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="External system identifier for filtering or lookup",
    required=False,
    examples=[
        OpenApiExample(
            name="GitHub Issue",
            value="1234567890",
            description="GitHub issue number",
        )
    ],
)

EXTERNAL_SOURCE_PARAMETER = OpenApiParameter(
    name="external_source",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="External system source name for filtering or lookup",
    required=False,
    examples=[
        OpenApiExample(
            name="GitHub",
            value="github",
            description="GitHub integration source",
        ),
        OpenApiExample(
            name="Jira",
            value="jira",
            description="Jira integration source",
        ),
    ],
)

# Ordering Parameters
ORDER_BY_PARAMETER = OpenApiParameter(
    name="order_by",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Field to order results by. Prefix with '-' for descending order",
    required=False,
    examples=[
        OpenApiExample(
            name="Created date descending",
            value="-created_at",
            description="Most recent items first",
        ),
        OpenApiExample(
            name="Priority ascending",
            value="priority",
            description="Order by priority (urgent, high, medium, low, none)",
        ),
        OpenApiExample(
            name="State group",
            value="state__group",
            description="Order by state group (backlog, unstarted, started, completed, cancelled)",  # noqa: E501
        ),
        OpenApiExample(
            name="Assignee name",
            value="assignees__first_name",
            description="Order by assignee first name",
        ),
    ],
)

# Search Parameters
SEARCH_PARAMETER = OpenApiParameter(
    name="search",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Search query to filter results by name, description, or identifier",
    required=False,
    examples=[
        OpenApiExample(
            name="Name search",
            value="bug fix",
            description="Search for items containing 'bug fix'",
        ),
        OpenApiExample(
            name="Sequence ID",
            value="123",
            description="Search by sequence ID number",
        ),
    ],
)

SEARCH_PARAMETER_REQUIRED = OpenApiParameter(
    name="search",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Search query to filter results by name, description, or identifier",
    required=True,
    examples=[
        OpenApiExample(
            name="Name search",
            value="bug fix",
            description="Search for items containing 'bug fix'",
        ),
        OpenApiExample(
            name="Sequence ID",
            value="123",
            description="Search by sequence ID number",
        ),
    ],
)

LIMIT_PARAMETER = OpenApiParameter(
    name="limit",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.QUERY,
    description="Maximum number of results to return",
    required=False,
    examples=[
        OpenApiExample(name="Default", value=10),
        OpenApiExample(name="More results", value=50),
    ],
)

WORKSPACE_SEARCH_PARAMETER = OpenApiParameter(
    name="workspace_search",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Whether to search across entire workspace or within specific project",
    required=False,
    examples=[
        OpenApiExample(
            name="Project only",
            value="false",
            description="Search within specific project only",
        ),
        OpenApiExample(
            name="Workspace wide",
            value="true",
            description="Search across entire workspace",
        ),
    ],
)

PROJECT_ID_QUERY_PARAMETER = OpenApiParameter(
    name="project_id",
    description="Project ID for filtering results within a specific project",
    required=False,
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.QUERY,
    examples=[
        OpenApiExample(
            name="Example project ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="Filter results for this project",
        )
    ],
)

# Cycle View Parameter
CYCLE_VIEW_PARAMETER = OpenApiParameter(
    name="cycle_view",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Filter cycles by status",
    required=False,
    examples=[
        OpenApiExample(name="All cycles", value="all"),
        OpenApiExample(name="Current cycles", value="current"),
        OpenApiExample(name="Upcoming cycles", value="upcoming"),
        OpenApiExample(name="Completed cycles", value="completed"),
        OpenApiExample(name="Draft cycles", value="draft"),
        OpenApiExample(name="Incomplete cycles", value="incomplete"),
    ],
)

# Field Selection Parameters
FIELDS_PARAMETER = OpenApiParameter(
    name="fields",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Comma-separated list of fields to include in response",
    required=False,
    examples=[
        OpenApiExample(
            name="Basic fields",
            value="id,name,description",
            description="Include only basic fields",
        ),
        OpenApiExample(
            name="With relations",
            value="id,name,assignees,state",
            description="Include fields with relationships",
        ),
    ],
)

EXPAND_PARAMETER = OpenApiParameter(
    name="expand",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Comma-separated list of related fields to expand in response",
    required=False,
    examples=[
        OpenApiExample(
            name="Expand assignees",
            value="assignees",
            description="Include full assignee details",
        ),
        OpenApiExample(
            name="Multiple expansions",
            value="assignees,labels,state",
            description="Include details for multiple relations",
        ),
    ],
)
