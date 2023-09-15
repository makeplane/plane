import uuid
import re
from datetime import datetime

def is_valid_uuid(uuid_string):
    try:
        uuid_obj = uuid.UUID(uuid_string)
        return str(uuid_obj) == uuid_string
    except ValueError:
        print(uuid_string, "False")
        return False

# Validations
def is_text(property, value) -> bool:
    return isinstance(value, str)

def is_paragraph(property, value) -> bool:
    return isinstance(value, str)

def is_number(property, value) -> bool:
    if property.is_multi:
        if isinstance(value, list):
            for val in value:
                try:
                    float(val)
                except ValueError:
                    return False
        else:
            return False
    else:
        try:
            float(value)
            return True
        except ValueError:
            return False

def is_checkbox(property, value) -> bool:
    return value in ["true", "false"]

def is_select(property, value) -> bool:
    return isinstance(value, str) and is_valid_uuid(value)

def is_multi_select(property, value) -> bool:
    return isinstance(value, str) and is_valid_uuid(value)

def is_relation(property, value) -> bool:
    return isinstance(value, str) and is_valid_uuid(value)

def is_file(property, value) -> bool:
    pattern = re.compile(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    return bool(pattern.match(value))

def is_email(property, value) -> bool:
    pattern = re.compile(r"[^@]+@[^@]+\.[^@]+")
    return bool(pattern.match(value))

def is_url(property, value) -> bool:
    pattern = re.compile(
        r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
    return bool(pattern.match(value))

def is_datetime(property, value) -> bool:
    try:
        datetime.strptime(value, '%Y-%m-%dT%H:%M:%S.%fZ')
        return True
    except ValueError:
        return False


# Validation Messages
def text_message(property):
    return {"error": f"{property.display_name} does not have a valid text"}

def paragraph_message(property):
    return {"error": f"{property.display_name} does not have a valid text"}

def number_message(property):
    return {"error": f"{property.display_name} does not have a valid number"}

def checkbox_message(property):
    return {"error": f"{property.display_name} does not have a valid checkbox input"}

def select_message(property):
    return {"error": f"{property.display_name} does not have a valid select input"}

def multi_select_message(property):
    return {"error": f"{property.display_name} does not have a valid multi select input"}

def relation_message(property):
    return {"error": f"{property.display_name} does not have a valid {property.unit}"}

def file_message(property):
    return {"error": f"{property.display_name} does not have a valid file input"}

def email_message(property):
    return {"error": f"{property.display_name} does not have a valid email input"}

def url_message(property):
    return {"error": f"{property.display_name} does not have a valid url input"}

def datetime_message(property):
    return {"error": f"{property.display_name} does not have a valid datetime input"}


def validators(property, value):

    # Field validations
    VALIDATION_MAPPER = {
        "text": is_text,
        "paragraph": is_paragraph,
        "number": is_number,
        "checkbox": is_checkbox,
        "select": is_select,
        "multi_select": is_multi_select,
        "relation": is_relation,
        "file": is_file,
        "email": is_email,
        "url": is_url,
        "datetime": is_datetime,
    }

    # Validation messages
    MESSAGE_MAPPER = {
        "text": text_message,
        "paragraph": paragraph_message,
        "number": number_message,
        "checkbox": checkbox_message,
        "select": select_message,
        "multi_select": multi_select_message,
        "relation": relation_message,
        "file": file_message,
        "email": email_message,
        "url": url_message,
        "datetime": datetime_message,
    }

    validator = VALIDATION_MAPPER.get(property.type, None)
    
    # Field validators and message functions
    if validator is not None:
        res = validator(property=property, value=value)
        if not res:
            res_message = MESSAGE_MAPPER.get(property.type, None)
            if res_message is not None:
                return False, res_message(property=property)
            return True, ""
        return True, ""
    return True, ""

