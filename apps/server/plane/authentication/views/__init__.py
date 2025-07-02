from .common import ChangePasswordEndpoint, CSRFTokenEndpoint, SetUserPasswordEndpoint

from .app.check import EmailCheckEndpoint

from .app.email import SignInAuthEndpoint, SignUpAuthEndpoint
from .app.github import GitHubCallbackEndpoint, GitHubOauthInitiateEndpoint
from .app.gitlab import GitLabCallbackEndpoint, GitLabOauthInitiateEndpoint
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


from .space.email import SignInAuthSpaceEndpoint, SignUpAuthSpaceEndpoint

from .space.github import GitHubCallbackSpaceEndpoint, GitHubOauthInitiateSpaceEndpoint

from .space.gitlab import GitLabCallbackSpaceEndpoint, GitLabOauthInitiateSpaceEndpoint

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

from .oauth import CustomAuthorizationView
