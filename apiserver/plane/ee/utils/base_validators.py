# Python imports
import uuid
from datetime import datetime

# Django imports
from django.core.exceptions import ValidationError
from django.core.validators import URLValidator
from django.core.validators import validate_email

def validate_text(property, value):
    pass

def validate_uuid(property, value):
    try:
        # Validate the UUID
        uuid.UUID(str(value), version=4)
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid UUID")
    

def validate_datetime(property, value):
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        try:
            datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValidationError(f"{value} is not a valid datetime")

def validate_decimal(property, value):
    try:
        # Validate the number
        float(value)
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid decimal")


def validate_boolean(property, value):
    try:
        # Validate the boolean
        if value not in ["true", "false"]:
            raise ValueError
    except ValueError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid boolean")

def validate_url(property, value):
    # Validate the URL
    url_validator = URLValidator()
    try:
        url_validator(value)
    except ValidationError:
        raise ValidationError(f"{value} is not a valid URL")


def validate_email_value(property, value):
    try:
        # Validate the email
        validate_email(value)
    except ValidationError:
        # Raise a validation error
        raise ValidationError(f"{value} is not a valid email")


def validate_file(property, value):
    pass