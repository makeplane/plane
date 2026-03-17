# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from .common import ChangePasswordEndpoint, CSRFTokenEndpoint, SetUserPasswordEndpoint

from .app.check import EmailCheckEndpoint

from .app.email import SignInAuthEndpoint, SignUpAuthEndpoint
from .app.github import GitHubCallbackEndpoint, GitHubOauthInitiateEndpoint
from .app.gitlab import GitLabCallbackEndpoint, GitLabOauthInitiateEndpoint
from .app.gitea import GiteaCallbackEndpoint, GiteaOauthInitiateEndpoint
from .app.google import GoogleCallbackEndpoint, GoogleOauthInitiateEndpoint
from .app.magic import MagicGenerateEndpoint, MagicSignInEndpoint, MagicSignUpEndpoint


from .app.oidc import OIDCAuthInitiateEndpoint, OIDCallbackEndpoint, OIDCLogoutEndpoint

from .app.saml import (
    SAMLAuthInitiateEndpoint,
    SAMLCallbackEndpoint,
    SAMLMetadataEndpoint,
    SAMLLogoutEndpoint,
)

from .app.signout import SignOutAuthEndpoint

from .app.ldap import LDAPSignInAuthEndpoint


# Space authentication exports
from .space.email import SignInAuthSpaceEndpoint, SignUpAuthSpaceEndpoint

from .space.github import GitHubCallbackSpaceEndpoint, GitHubOauthInitiateSpaceEndpoint

from .space.gitlab import GitLabCallbackSpaceEndpoint, GitLabOauthInitiateSpaceEndpoint

from .space.gitea import GiteaCallbackSpaceEndpoint, GiteaOauthInitiateSpaceEndpoint

from .space.google import GoogleCallbackSpaceEndpoint, GoogleOauthInitiateSpaceEndpoint

from .space.magic import (
    MagicGenerateSpaceEndpoint,
    MagicSignInSpaceEndpoint,
    MagicSignUpSpaceEndpoint,
)

from .space.signout import SignOutAuthSpaceEndpoint

from .space.check import EmailCheckSpaceEndpoint

from .space.password_management import (
    ForgotPasswordSpaceEndpoint,
    ResetPasswordSpaceEndpoint,
)
from .app.password_management import ForgotPasswordEndpoint, ResetPasswordEndpoint


# Mobile web view authentication exports
from .app.mobile.check import MobileEmailCheckEndpoint
from .app.mobile.email import MobileSignInAuthEndpoint, MobileSignUpAuthEndpoint
from .app.mobile.magic import (
    MobileMagicSignInEndpoint,
    MobileMagicSignUpEndpoint,
    MobileMagicGenerateEndpoint,
)
from .app.mobile.token import (
    MobileSessionTokenCheckEndpoint,
    MobileSessionTokenEndpoint,
    MobileTokenEndpoint,
    MobileRefreshTokenEndpoint,
)
from .app.mobile.signout import MobileSignOutAuthEndpoint
from .app.mobile.google import (
    MobileGoogleOauthInitiateEndpoint,
    MobileGoogleCallbackEndpoint,
)
from .app.mobile.github import (
    MobileGitHubOauthInitiateEndpoint,
    MobileGitHubCallbackEndpoint,
)
from .app.mobile.oidc import (
    MobileOIDCAuthInitiateEndpoint,
    MobileOIDCallbackEndpoint,
    MobileOIDCLogoutEndpoint,
)
from .app.mobile.saml import (
    MobileSAMLAuthInitiateEndpoint,
    MobileSAMLCallbackEndpoint,
    MobileSAMLLogoutEndpoint,
    MobileSAMLMetadataEndpoint,
)

# Admin authentication exports
from .admin import (
    GoogleOauthInitiateAdminEndpoint,
    GoogleCallbackAdminEndpoint,
    GitHubOauthInitiateAdminEndpoint,
    GitHubCallbackAdminEndpoint,
    GitLabOauthInitiateAdminEndpoint,
    GitLabCallbackAdminEndpoint,
    GiteaOauthInitiateAdminEndpoint,
    GiteaCallbackAdminEndpoint,
    OIDCAuthInitiateAdminEndpoint,
    OIDCCallbackAdminEndpoint,
    SAMLAuthInitiateAdminEndpoint,
    LDAPSignInAuthAdminEndpoint,
    MagicGenerateAdminEndpoint,
    MagicSignInAdminEndpoint,
)

from .oauth import CustomAuthorizationView

# Desktop authentication exports
from .app.desktop import (
    DesktopGoogleOauthInitiateEndpoint,
    DesktopGoogleCallbackEndpoint,
    DesktopGitHubOauthInitiateEndpoint,
    DesktopGitHubCallbackEndpoint,
    DesktopGitLabOauthInitiateEndpoint,
    DesktopGitLabCallbackEndpoint,
    DesktopGiteaOauthInitiateEndpoint,
    DesktopGiteaCallbackEndpoint,
    DesktopTokenExchangeEndpoint,
    DesktopSignOutEndpoint,
)

from .sso import (
    SSOAuthInitiateEndpoint,
    IdentityProviderEndpoint,
    DomainEndpoint,
    DomainVerificationEndpoint,
    OIDCAuthCloudCallbackEndpoint,
    SAMLAuthCloudMetadataEndpoint,
    SAMLAuthCloudCallbackEndpoint,
    SAMLAuthCloudLogoutEndpoint,
    GroupSyncConfigEndpoint,
    GroupMappingEndpoint,
)
