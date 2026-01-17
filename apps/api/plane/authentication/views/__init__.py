from .app.check import EmailCheckEndpoint
from .app.email import SignInAuthEndpoint, SignUpAuthEndpoint
from .app.gitea import GiteaCallbackEndpoint, GiteaOauthInitiateEndpoint
from .app.github import GitHubCallbackEndpoint, GitHubOauthInitiateEndpoint
from .app.gitlab import GitLabCallbackEndpoint, GitLabOauthInitiateEndpoint
from .app.google import GoogleCallbackEndpoint, GoogleOauthInitiateEndpoint
from .app.magic import MagicGenerateEndpoint, MagicSignInEndpoint, MagicSignUpEndpoint
from .app.oidc import OidcCallbackEndpoint, OidcInitiateEndpoint
from .app.password_management import ForgotPasswordEndpoint, ResetPasswordEndpoint
from .app.signout import SignOutAuthEndpoint
from .common import ChangePasswordEndpoint, CSRFTokenEndpoint, SetUserPasswordEndpoint
from .space.check import EmailCheckSpaceEndpoint
from .space.email import SignInAuthSpaceEndpoint, SignUpAuthSpaceEndpoint
from .space.gitea import GiteaCallbackSpaceEndpoint, GiteaOauthInitiateSpaceEndpoint
from .space.github import GitHubCallbackSpaceEndpoint, GitHubOauthInitiateSpaceEndpoint
from .space.gitlab import GitLabCallbackSpaceEndpoint, GitLabOauthInitiateSpaceEndpoint
from .space.google import GoogleCallbackSpaceEndpoint, GoogleOauthInitiateSpaceEndpoint
from .space.magic import (
    MagicGenerateSpaceEndpoint,
    MagicSignInSpaceEndpoint,
    MagicSignUpSpaceEndpoint,
)
from .space.password_management import (
    ForgotPasswordSpaceEndpoint,
    ResetPasswordSpaceEndpoint,
)
from .space.signout import SignOutAuthSpaceEndpoint
