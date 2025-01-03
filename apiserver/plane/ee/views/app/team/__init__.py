from .base import TeamSpaceEndpoint
from .member import TeamSpaceMembersEndpoint
from .analytic import (
    TeamSpaceEntitiesEndpoint,
    TeamSpaceWorkLoadEndpoint,
    TeamSpaceDependencyEndpoint,
    TeamSpaceStatisticsEndpoint,
)
from .views import TeamSpaceViewEndpoint
from .cycle import TeamSpaceCycleEndpoint
from .page import (
    TeamSpacePageEndpoint,
    TeamSpacePageVersionEndpoint,
    TeamSpacePagesDescriptionEndpoint,
    TeamSpacePageArchiveEndpoint,
    TeamSpacePageUnarchiveEndpoint,
    TeamSpacePageLockEndpoint,
    TeamSpacePageFavoriteEndpoint,
    TeamSpacePageDuplicateEndpoint,
)
from .issue import TeamSpaceIssueEndpoint, TeamSpaceUserPropertiesEndpoint
from .activity import TeamSpaceActivityEndpoint
from .comment import TeamSpaceCommentEndpoint, TeamSpaceCommentReactionEndpoint
