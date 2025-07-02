from .instance import InstanceEndpoint, SignUpScreenVisitedEndpoint


from .configuration import (
    EmailCredentialCheckEndpoint,
    InstanceConfigurationEndpoint,
    AdminFeatureFlagEndpoint,
)

from .admin import (
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceAdminSignUpEndpoint,
    InstanceAdminUserMeEndpoint,
    InstanceAdminSignOutEndpoint,
    InstanceAdminUserSessionEndpoint,
)


from .workspace import (
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
)

from .changelog import CheckUpdateEndpoint
