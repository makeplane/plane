import pytest
from django.core.exceptions import ValidationError

from plane.ee.models.template import Template


@pytest.mark.unit
class TestTemplateModel:
    """Test the Template model"""

    @pytest.mark.django_db
    def test_template_creation(self, workspace):
        """Test creating a template with basic fields"""
        # Arrange
        template_data = {
            "name": "Test Template",
            "workspace": workspace,
            "template_type": Template.TemplateType.WORKITEM,
            "description": {"content": "Test description"},
            "description_html": "<p>Test description</p>",
            "company_name": "Test Company",
            "short_description": "Short test description",
        }

        # Act
        template = Template.objects.create(**template_data)

        # Assert
        # Basic fields
        assert template.id is not None
        assert template.name == template_data["name"]
        assert template.template_type == template_data["template_type"]
        assert template.description == template_data["description"]
        assert template.description_html == template_data["description_html"]
        assert template.company_name == template_data["company_name"]
        assert template.short_description == template_data["short_description"]

        # Default values
        assert template.is_published is False
        assert template.is_verified is False
        assert template.supported_languages == {}
        assert template.support == {}
        assert template.resources == {}
        assert template.keywords == []

    @pytest.mark.django_db
    def test_template_description_stripping(self, workspace):
        """Test that HTML tags are stripped from description_html"""
        # Arrange
        html_content = "<p>Test <b>description</b> with <i>HTML</i></p>"
        expected_stripped = "Test description with HTML"

        # Act
        template = Template.objects.create(
            name="Test Template",
            workspace=workspace,
            description_html=html_content,
        )

        # Assert
        assert template.description_stripped == expected_stripped

    @pytest.mark.django_db
    def test_template_empty_description(self, workspace):
        """Test template with empty description"""
        # Arrange
        empty_html = ""

        # Act
        template = Template.objects.create(
            name="Test Template",
            workspace=workspace,
            description_html=empty_html,
        )

        # Assert
        assert template.description_stripped is None

    @pytest.mark.django_db
    def test_template_type_choices(self, workspace):
        """Test template type choices"""
        # Arrange
        valid_types = Template.TemplateType.values
        invalid_type = "invalid_type"

        # Act & Assert for valid types
        for template_type in valid_types:
            template = Template.objects.create(
                name=f"Test {template_type}",
                workspace=workspace,
                template_type=template_type,
            )
            assert template.template_type == template_type

        # Act & Assert for invalid type
        template = Template(
            name="Invalid Template",
            workspace=workspace,
            template_type=invalid_type,
        )
        with pytest.raises(ValidationError):
            template.full_clean()

    @pytest.mark.django_db
    def test_template_url_fields(self, workspace):
        """Test template URL fields"""
        # Arrange
        url_data = {
            "privacy_policy_url": "https://example.com/privacy",
            "terms_of_service_url": "https://example.com/terms",
            "support_url": "https://example.com/support",
            "video_url": "https://example.com/video",
            "website": "https://example.com",
        }

        # Act
        template = Template.objects.create(
            name="Test Template",
            workspace=workspace,
            **url_data,
        )

        # Assert
        for field, expected_url in url_data.items():
            assert getattr(template, field) == expected_url

    @pytest.mark.django_db
    def test_template_contact_email(self, workspace):
        """Test template contact email field"""
        # Arrange
        valid_email = "test@example.com"
        invalid_email = "invalid-email"

        # Act & Assert for valid email
        template = Template.objects.create(
            name="Test Template",
            workspace=workspace,
            contact_email=valid_email,
        )
        assert template.contact_email == valid_email

        # Act & Assert for invalid email
        template = Template(
            name="Invalid Template",
            workspace=workspace,
            contact_email=invalid_email,
        )
        with pytest.raises(ValidationError):
            template.full_clean()

    @pytest.mark.django_db
    def test_template_cover_image_url(self, workspace, cover_image_asset):
        """Test template cover image URL property"""
        # Arrange
        template_name = "Test Template"

        # Act - Test without cover image
        template = Template.objects.create(
            name=template_name,
            workspace=workspace,
        )
        assert template.cover_image_url is None

        # Act - Test with cover image
        template.cover_image_asset = cover_image_asset
        template.save()

        # Assert
        assert template.cover_image_url == cover_image_asset.asset_url
