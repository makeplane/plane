# Python imports
import uuid
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.core.validators import validate_email

# module imports
from plane.ee.models import (
    PropertyTypeEnum,
    IssuePropertyValue,
    IssuePropertyOption,
    RelationTypeEnum,
)
from plane.db.models import Issue, WorkspaceMember


# Issue property validator
class PropertyValidator:
    def __init__(self, issue_property):
        self.issue_property = issue_property

    # text
    def is_valid_text(self, value):
        pass

    # uuid
    def is_valid_uuid(self, value):
        try:
            # Validate the UUID
            uuid.UUID(str(value), version=4)
        except ValueError:
            # Raise a validation error
            raise ValidationError(f"{value} is not a valid UUID")

    # datetime
    def is_valid_datetime(self, value):
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            try:
                datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                raise ValidationError(f"{value} is not a valid datetime")

    # decimal
    def is_valid_decimal(self, value):
        try:
            # Validate the number
            float(value)
        except ValueError:
            # Raise a validation error
            raise ValidationError(f"{value} is not a valid decimal")

    # boolean
    def is_valid_boolean(self, value):
        try:
            # Validate the boolean
            if value not in ["true", "false"]:
                raise ValueError
        except ValueError:
            # Raise a validation error
            raise ValidationError(f"{value} is not a valid boolean")

    # email
    def is_valid_email(self, value):
        try:
            # Validate the email
            validate_email(value)
        except ValidationError:
            raise ValidationError(f"{value} is not a valid email")

    # url
    def is_valid_url(self, value):
        # Initialize URLValidator
        url_validator = URLValidator()
        try:
            # validate the value
            url_validator(value)
        except ValidationError:
            raise ValidationError(f"{value} is not a valid URL")

    # file
    def is_valid_file(self, value):
        pass

    # validate the option
    def is_valid_option(self, value):
        # Validate the UUID
        self.is_valid_uuid(value)

        if not IssuePropertyOption.objects.filter(
            property=self.issue_property, id=value
        ).exists():
            raise ValidationError(f"{value} is not a valid option")

    # validate for relation
    def is_valid_relation(self, value):
        # Validate the UUID
        self.is_valid_uuid(value)

        # Validate the issue relation
        if self.issue_property.relation_type == RelationTypeEnum.ISSUE:
            issue = Issue.objects.filter(
                workspace_id=self.issue_property.workspace_id, id=value
            )
            if not issue.exists():
                raise ValidationError(f"{value} is not a valid issue")
        # Validate the issue relation
        elif self.issue_property.relation_type == RelationTypeEnum.USER:
            workspace_member = WorkspaceMember.objects.filter(
                workspace_id=self.issue_property.workspace_id, member_id=value
            )
            if not workspace_member.exists():
                raise ValidationError(f"{value} is not a valid user")
        else:
            raise ValidationError(
                f"{self.issue_property.relation_type} is not a valid relation type"
            )


class PropertySaver:
    def __init__(
        self,
        workspace_id,
        project_id,
        issue_id,
        issue_property,
        external_id,
        external_source,
    ):
        self.issue_property = issue_property
        self.base_params = {
            "workspace_id": workspace_id,
            "project_id": project_id,
            "issue_id": issue_id,
            "property": issue_property,
            "external_id": external_id,
            "external_source": external_source,
        }

    def _save_value(self, value, field_name):
        if value:
            return IssuePropertyValue(**self.base_params, **{field_name: value})

    # text
    def save_text(self, value):
        return self._save_value(value, "value_text")

    # datetime
    def save_datetime(self, value):
        return self._save_value(value, "value_datetime")

    # decimal
    def save_decimal(self, value):
        return self._save_value(value, "value_decimal")

    # boolean
    def save_boolean(self, value):
        return self._save_value(value, "value_boolean")

    # url
    def save_url(self, value):
        return self._save_value(value, "value_url")

    # email
    def save_email(self, value):
        return self._save_value(value, "value_email")

    # file
    def save_file(self, value):
        return self._save_value(value, "value_file")

    # option
    def save_option(self, value):
        return self._save_value(value, "value_option_id")

    # relation
    def save_relation(self, value):
        return self._save_value(value, "value_uuid")


def get_property_validator(issue_property):
    # property validator initialization
    property_validator = PropertyValidator(issue_property)
    PROPERTY_VALIDATOR_MAPPER = {
        PropertyTypeEnum.TEXT: property_validator.is_valid_text,
        PropertyTypeEnum.DATETIME: property_validator.is_valid_datetime,
        PropertyTypeEnum.DECIMAL: property_validator.is_valid_decimal,
        PropertyTypeEnum.BOOLEAN: property_validator.is_valid_boolean,
        PropertyTypeEnum.URL: property_validator.is_valid_url,
        PropertyTypeEnum.EMAIL: property_validator.is_valid_email,
        PropertyTypeEnum.FILE: property_validator.is_valid_file,
        PropertyTypeEnum.OPTION: property_validator.is_valid_option,
        PropertyTypeEnum.RELATION: property_validator.is_valid_relation,
    }

    # get the validator
    validator = PROPERTY_VALIDATOR_MAPPER.get(issue_property.property_type)

    return validator


# validate the values
def externalIssuePropertyValueValidator(issue_property, value):
    validator = get_property_validator(issue_property)

    if not validator:
        raise ValidationError(
            f"{issue_property.property_type} is not a valid property type"
        )

    # Check if the property is required
    if issue_property.is_required and not value:
        raise ValidationError(f"{issue_property.display_name} is a required property")

    validator(value=value)

    return


# save the property values
def externalIssuePropertyValueSaver(
    workspace_id,
    project_id,
    issue_id,
    issue_property,
    value,
    external_id,
    external_source,
):
    # property saver initialization
    property_saver = PropertySaver(
        workspace_id, project_id, issue_id, issue_property, external_id, external_source
    )
    PROPERTY_SAVER_MAPPER = {
        PropertyTypeEnum.TEXT: property_saver.save_text,
        PropertyTypeEnum.DATETIME: property_saver.save_datetime,
        PropertyTypeEnum.DECIMAL: property_saver.save_decimal,
        PropertyTypeEnum.BOOLEAN: property_saver.save_boolean,
        PropertyTypeEnum.URL: property_saver.save_url,
        PropertyTypeEnum.EMAIL: property_saver.save_email,
        PropertyTypeEnum.FILE: property_saver.save_file,
        PropertyTypeEnum.OPTION: property_saver.save_option,
        PropertyTypeEnum.RELATION: property_saver.save_relation,
    }

    # get the saver
    saver = PROPERTY_SAVER_MAPPER.get(issue_property.property_type)

    if not saver:
        raise ValidationError(
            f"{issue_property.property_type} is not a valid property type"
        )

    # Save the value
    return saver(value)
