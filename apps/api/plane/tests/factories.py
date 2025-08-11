import factory
from uuid import uuid4
from django.utils import timezone

from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    Page,
)
from plane.authentication.models import (
    Application,
    ApplicationOwner,
    WorkspaceAppInstallation,
)


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating User instances"""

    class Meta:
        model = User
        django_get_or_create = ("email",)

    id = factory.LazyFunction(uuid4)
    email = factory.Sequence(lambda n: f"user{n}@plane.so")
    password = factory.PostGenerationMethodCall("set_password", "password")
    first_name = factory.Sequence(lambda n: f"First{n}")
    last_name = factory.Sequence(lambda n: f"Last{n}")
    is_active = True
    is_superuser = False
    is_staff = False


class WorkspaceFactory(factory.django.DjangoModelFactory):
    """Factory for creating Workspace instances"""

    class Meta:
        model = Workspace
        django_get_or_create = ("slug",)

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Workspace {n}")
    slug = factory.Sequence(lambda n: f"workspace-{n}")
    owner = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class WorkspaceMemberFactory(factory.django.DjangoModelFactory):
    """Factory for creating WorkspaceMember instances"""

    class Meta:
        model = WorkspaceMember

    id = factory.LazyFunction(uuid4)
    workspace = factory.SubFactory(WorkspaceFactory)
    member = factory.SubFactory(UserFactory)
    role = 20  # Admin role by default
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class ProjectFactory(factory.django.DjangoModelFactory):
    """Factory for creating Project instances"""

    class Meta:
        model = Project
        django_get_or_create = ("name", "workspace")

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Project {n}")
    workspace = factory.SubFactory(WorkspaceFactory)
    created_by = factory.SelfAttribute("workspace.owner")
    updated_by = factory.SelfAttribute("workspace.owner")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class ProjectMemberFactory(factory.django.DjangoModelFactory):
    """Factory for creating ProjectMember instances"""

    class Meta:
        model = ProjectMember

    id = factory.LazyFunction(uuid4)
    project = factory.SubFactory(ProjectFactory)
    member = factory.SubFactory(UserFactory)
    role = 20  # Admin role by default
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class ApplicationFactory(factory.django.DjangoModelFactory):
    """Factory for creating Application instances"""

    class Meta:
        model = Application
        django_get_or_create = ("slug",)

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Test App {n}")
    slug = factory.Sequence(lambda n: f"test-app-{n}")
    short_description = factory.Sequence(lambda n: f"Test application {n}")
    description_html = "<p>Test description</p>"
    company_name = factory.Sequence(lambda n: f"Test Company {n}")
    user = factory.SubFactory(UserFactory)
    created_by = factory.SelfAttribute("user")
    updated_by = factory.SelfAttribute("user")
    client_id = factory.Sequence(lambda n: f"test-client-id-{n}")
    client_secret = factory.Sequence(lambda n: f"test-client-secret-{n}")
    client_type = Application.CLIENT_CONFIDENTIAL
    authorization_grant_type = Application.GRANT_AUTHORIZATION_CODE
    webhook_url = factory.Sequence(lambda n: f"https://test-webhook-url-{n}")


class ApplicationOwnerFactory(factory.django.DjangoModelFactory):
    """Factory for creating ApplicationOwner instances"""

    class Meta:
        model = ApplicationOwner

    id = factory.LazyFunction(uuid4)
    user = factory.SubFactory(UserFactory)
    application = factory.SubFactory(ApplicationFactory)
    workspace = factory.SubFactory(WorkspaceFactory)


class WorkspaceAppInstallationFactory(factory.django.DjangoModelFactory):
    """Factory for creating WorkspaceAppInstallation instances"""

    class Meta:
        model = WorkspaceAppInstallation

    id = factory.LazyFunction(uuid4)
    workspace = factory.SubFactory(WorkspaceFactory)
    application = factory.SubFactory(ApplicationFactory)
    installed_by = factory.SubFactory(UserFactory)
    status = WorkspaceAppInstallation.Status.INSTALLED


class PageFactory(factory.django.DjangoModelFactory):
    """Factory for creating Page instances"""

    class Meta:
        model = Page

    id = factory.LazyFunction(uuid4)
    workspace = factory.SubFactory(WorkspaceFactory)
    name = factory.Sequence(lambda n: f"Page {n}")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
    access = Page.PUBLIC_ACCESS
    color = "#000000"
    logo_props = {}
    is_global = False
    external_id = None
    external_source = None
    description = {}
    description_binary = None
    description_html = "<p></p>"
    description_stripped = None
