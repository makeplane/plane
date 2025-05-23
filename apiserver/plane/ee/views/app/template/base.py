# Third party imports
from pydantic import ValidationError

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.ee.models.template import (
    Assignee,
    Label,
    Module,
    State,
    Type,
    IssueProperty,
    PageParent,
    ProjectState,
    Estimate,
    Epic,
    WorkitemType,
    WorkitemState,
    IntakeSettings,
)


class TemplateBaseEndpoint(BaseAPIView):
    def validate_field(self, data, field_name, model_class):
        """
        Validates a JSON field against its Pydantic model class.

        Args:
            data (dict): Request data.
            field_name (str): Name of the JSON field.
            model_class: The Pydantic model class to validate against.

        Returns:
            tuple: (is_valid, errors)
        """
        if field_name not in data or not data[field_name]:
            return True, {}  # Empty field is valid for default dict fields

        try:
            # For list fields
            if isinstance(data[field_name], list):
                errors = []
                for i, item in enumerate(data[field_name]):
                    try:
                        model_class(**item)
                    except ValidationError as e:
                        errors.append({f"{field_name}[{i}]": e.errors()})
                return not errors, errors

            # For single object fields
            else:
                model_class(**data[field_name])
                return True, {}
        except ValidationError as e:
            return False, {field_name: e.errors()}

    def validate_workitem_fields(self, template_data):
        """
        Validates JSON fields in the work item template data.

        Args:
            template_data (dict): Request data for work item template.

        Returns:
            tuple: (is_valid, errors)
        """
        validation_map = {
            "state": State,
            "type": Type,
            "assignees": Assignee,
            "labels": Label,
            "modules": Module,
            "properties": IssueProperty,
        }

        validation_errors = {}
        for field_name, model_class in validation_map.items():
            is_valid, errors = self.validate_field(
                template_data, field_name, model_class
            )
            if not is_valid:
                if isinstance(errors, dict):
                    validation_errors.update(errors)
                else:
                    validation_errors[field_name] = errors

        return (False, validation_errors) if validation_errors else (True, {})

    def validate_page_fields(self, template_date):
        """
                Validates JSON fields in the page template data.

                Args:
                    template_date (dict): Request data for page template.

                Returns:
                    tuple: (is_valid, errors)
        """
        validation_map = {"parent": PageParent}

        validation_errors = {}
        for field_name, model_class in validation_map.items():
            is_valid, errors = self.validate_field(
                template_date, field_name, model_class
            )

            if not is_valid:
                if isinstance(errors, dict):
                    validation_errors.update(errors)
                else:
                    validation_errors[field_name] = errors

        return (False, validation_errors) if validation_errors else (True, {})

    def validate_project_fields(self, template_date):
        """
                Validates JSON fields in the page template data.

                Args:
                    template_date (dict): Request data for page template.

                Returns:
                    tuple: (is_valid, errors)
        """
        validation_map = {
            "project_state": ProjectState,
            "states": WorkitemState,
            "labels": Label,
            "estimates": Estimate,
            "workitem_types": WorkitemType,
            "epics": Epic,
            "intake_settings": IntakeSettings,
        }

        validation_errors = {}
        for field_name, model_class in validation_map.items():
            is_valid, errors = self.validate_field(
                template_date, field_name, model_class
            )

            if not is_valid:
                if isinstance(errors, dict):
                    validation_errors.update(errors)
                else:
                    validation_errors[field_name] = errors

        return (False, validation_errors) if validation_errors else (True, {})
