import pytest
from unittest.mock import patch
from django.core.exceptions import ObjectDoesNotExist

from plane.silo.services.generate_application import generate_application
from plane.silo.utils.constants import APPLICATIONS
from plane.authentication.models import Application
from plane.silo.models.application_secret import ApplicationSecret
from plane.db.models import User


@pytest.mark.unit
class TestGenerateApplication:
    """Test the generate_application function"""

    def test_applications_data_sanity(self):
        """All keys should only contain lowecase letters and underscores"""
        for app_key in APPLICATIONS.keys():
            assert all(c.islower() or c == "_" for c in app_key)

        """All slugs should be lowercase and contain only letters and hyphens"""
        for _, app_data in APPLICATIONS.items():
            assert all(c.islower() or c == "-" for c in app_data["slug"])

        """Test if all required keys are present in all applications in APPLICATIONS constant"""
        for _, app_data in APPLICATIONS.items():
            assert all(
                key in app_data
                for key in [
                    "key",
                    "name",
                    "slug",
                    "short_description",
                    "description_html",
                    "redirect_uris",
                ]
            )

        """Test if all values in APPLICATIONS are in right format"""
        for _, app_data in APPLICATIONS.items():
            assert isinstance(app_data["key"], str)
            assert isinstance(app_data["name"], str)
            assert isinstance(app_data["slug"], str)
            assert isinstance(app_data["short_description"], str)
            assert isinstance(app_data["description_html"], str)
            assert isinstance(app_data["redirect_uris"], str)

    @pytest.mark.django_db
    @patch("plane.silo.services.generate_application.encrypt")
    @patch("plane.silo.services.generate_application.generate_client_secret")
    def test_generate_application_success_new_application(
        self,
        mock_generate_client_secret,
        mock_encrypt,
        create_user,
    ):
        """Test successful application generation for a new application"""
        # Arrange
        user_id = str(create_user.id)
        app_key = "github"
        app_data = APPLICATIONS[app_key]

        # Mock client secret generation
        mock_generate_client_secret.return_value = "test-client-secret"

        # Mock encryption
        mock_encrypt.return_value = {
            "iv": "test-iv",
            "ciphertext": "test-ciphertext",
            "tag": "test-tag",
        }

        # Act
        result = generate_application(
            user_id,
            app_key,
            Application,
            ApplicationSecret,
            User,
        )

        # Assert
        assert result is not None

        # Verify application was created
        application = Application.objects.get(id=result)
        assert application.name == app_data["name"]
        assert application.slug == app_data["slug"]
        assert application.description_html == app_data["description_html"]
        assert application.short_description == app_data["short_description"]
        assert application.company_name == create_user.display_name
        assert application.redirect_uris == app_data["redirect_uris"]
        assert application.skip_authorization is True
        assert application.client_type == "confidential"
        assert application.authorization_grant_type == "authorization-code"
        assert application.user_id == create_user.id

        # Verify encryption was called
        mock_encrypt.assert_called_once_with("test-client-secret")

        # Verify application secrets were created
        secrets = ApplicationSecret.objects.filter(
            key__in=[
                f"x-{app_key}-id",
                f"x-{app_key}-client_id",
                f"x-{app_key}-client_secret",
            ]
        )
        assert secrets.count() == 3

        # Check each secret
        id_secret = secrets.get(key=f"x-{app_key}-id")
        assert id_secret.value == str(application.id)
        assert id_secret.is_secured is False

        client_id_secret = secrets.get(key=f"x-{app_key}-client_id")
        assert client_id_secret.value == application.client_id
        assert client_id_secret.is_secured is False

        client_secret_secret = secrets.get(key=f"x-{app_key}-client_secret")
        assert client_secret_secret.value == "test-iv:test-ciphertext:test-tag"
        assert client_secret_secret.is_secured is True

    @pytest.mark.django_db
    @patch("plane.silo.services.generate_application.encrypt")
    @patch("plane.silo.services.generate_application.generate_client_secret")
    def test_generate_application_success_existing_application(
        self,
        mock_generate_client_secret,
        mock_encrypt,
        create_user,
    ):
        """Test successful application generation when application already exists"""
        # Arrange
        user_id = str(create_user.id)
        app_key = "github"
        app_data = APPLICATIONS[app_key]

        # Create an existing application
        existing_app = Application.objects.create(
            name=app_data["name"],
            slug=app_data["slug"],
            description_html=app_data["description_html"],
            short_description=app_data["short_description"],
            company_name=create_user.display_name,
            redirect_uris=app_data["redirect_uris"],
            skip_authorization=True,
            client_type="confidential",
            authorization_grant_type="authorization-code",
            user=create_user,
            client_secret="old-client-secret",
        )

        # Mock client secret generation
        mock_generate_client_secret.return_value = "new-client-secret"

        # Mock encryption
        mock_encrypt.return_value = {
            "iv": "new-iv",
            "ciphertext": "new-ciphertext",
            "tag": "new-tag",
        }

        # Act
        result = generate_application(
            user_id,
            app_key,
            Application,
            ApplicationSecret,
            User,
        )

        # Assert
        assert result == existing_app.id

        # Verify existing application was updated
        existing_app.refresh_from_db()
        assert existing_app.redirect_uris == app_data["redirect_uris"]

    @pytest.mark.django_db
    def test_generate_application_existing_secret_skips(
        self,
        create_user,
    ):
        """Test that generation is skipped when application secret already exists"""
        # Arrange
        user_id = str(create_user.id)
        app_key = "github"

        # Create an existing application secret
        ApplicationSecret.objects.create(
            key=f"x-{app_key}-id",
            value="existing-app-id",
            is_secured=False,
        )

        # Act
        result = generate_application(
            user_id,
            app_key,
            Application,
            ApplicationSecret,
            User,
        )

        # Assert
        assert result is None

        # Verify no application was created
        assert Application.objects.count() == 0

    @pytest.mark.django_db
    def test_generate_application_user_not_found(
        self,
    ):
        """Test application generation when user does not exist"""
        # Arrange
        user_id = "00000000-0000-0000-0000-000000000000"
        app_key = "github"

        # Act & Assert
        with pytest.raises(ObjectDoesNotExist):
            generate_application(
                user_id,
                app_key,
                Application,
                ApplicationSecret,
                User,
            )

    @pytest.mark.django_db
    def test_generate_application_invalid_app_key(
        self,
        create_user,
    ):
        """Test application generation with invalid app key"""
        # Arrange
        user_id = str(create_user.id)
        app_key = "invalid-app-key"

        # Act & Assert
        with pytest.raises(KeyError):
            generate_application(
                user_id,
                app_key,
                Application,
                ApplicationSecret,
                User,
            )

    @pytest.mark.django_db
    @patch("plane.silo.services.generate_application.encrypt")
    @patch("plane.silo.services.generate_application.generate_client_secret")
    def test_generate_application_transaction_rollback(
        self,
        mock_generate_client_secret,
        mock_encrypt,
        create_user,
    ):
        """Test that transaction rollback occurs on error"""
        # Arrange
        user_id = str(create_user.id)
        app_key = "github"

        # Mock client secret generation
        mock_generate_client_secret.return_value = "test-client-secret"

        # Mock encryption to raise an exception
        mock_encrypt.side_effect = Exception("Encryption error")

        # Act & Assert
        with pytest.raises(Exception, match="Encryption error"):
            generate_application(
                user_id,
                app_key,
                Application,
                ApplicationSecret,
                User,
            )

        # Verify no application was created due to rollback
        assert Application.objects.count() == 0
        assert ApplicationSecret.objects.count() == 0

    @pytest.mark.django_db
    @patch("plane.silo.services.generate_application.encrypt")
    @patch("plane.silo.services.generate_application.generate_client_secret")
    def test_generate_application_all_app_types(
        self,
        mock_generate_client_secret,
        mock_encrypt,
        create_user,
    ):
        """Test application generation for all app types in APPLICATIONS"""
        # Arrange
        user_id = str(create_user.id)

        # Mock client secret generation
        mock_generate_client_secret.return_value = "test-client-secret"

        # Mock encryption
        mock_encrypt.return_value = {
            "iv": "test-iv",
            "ciphertext": "test-ciphertext",
            "tag": "test-tag",
        }

        # Act & Assert for each app type
        for app_key in APPLICATIONS.keys():
            result = generate_application(
                user_id,
                app_key,
                Application,
                ApplicationSecret,
                User,
            )

            assert result is not None

            # Verify the correct app data was used
            app_data = APPLICATIONS[app_key]
            application = Application.objects.get(id=result)
            assert application.name == app_data["name"]
            assert application.slug == app_data["slug"]
            assert application.redirect_uris == app_data["redirect_uris"]
