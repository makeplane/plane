from .common import (
    ChangePasswordEndpoint,
    CSRFTokenEndpoint,
    SetUserPasswordEndpoint,
)

from .app.check import EmailCheckEndpoint

from .app.email import (
    SignInAuthEndpoint,
    SignUpAuthEndpoint,
)
from .app.github import (
    GitHubCallbackEndpoint,
    GitHubOauthInitiateEndpoint,
)
from .app.google import (
    GoogleCallbackEndpoint,
    GoogleOauthInitiateEndpoint,
)
from .app.magic import (
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    MagicSignUpEndpoint,
)

from .app.signout import SignOutAuthEndpoint


from .space.email import SignInAuthSpaceEndpoint, SignUpAuthSpaceEndpoint

from .space.github import (
    GitHubCallbackSpaceEndpoint,
    GitHubOauthInitiateSpaceEndpoint,
)

from .space.google import (
    GoogleCallbackSpaceEndpoint,
    GoogleOauthInitiateSpaceEndpoint,
)

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
from .app.password_management import (
    ForgotPasswordEndpoint,
    ResetPasswordEndpoint,
)
