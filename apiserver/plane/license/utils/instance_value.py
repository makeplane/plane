import os


# Helper function to return value from the passed key
def get_configuration_value(query, key, default=None):
    for item in query:
        if item["key"] == key:
            return item.get("value", default)
    return default


def get_email_configuration(instance_configuration):
    # Get the configuration variables
    EMAIL_HOST_USER = get_configuration_value(
        instance_configuration,
        "EMAIL_HOST_USER",
        os.environ.get("EMAIL_HOST_USER", None),
    )

    EMAIL_HOST_PASSWORD = get_configuration_value(
        instance_configuration,
        "EMAIL_HOST_PASSWORD",
        os.environ.get("EMAIL_HOST_PASSWORD", None),
    )

    EMAIL_HOST = get_configuration_value(
        instance_configuration,
        "EMAIL_HOST",
        os.environ.get("EMAIL_HOST", None),
    )

    EMAIL_FROM = get_configuration_value(
        instance_configuration,
        "EMAIL_FROM",
        os.environ.get("EMAIL_FROM", None),
    )

    EMAIL_USE_TLS = get_configuration_value(
        instance_configuration,
        "EMAIL_USE_TLS",
        os.environ.get("EMAIL_USE_TLS", "1"),
    )

    EMAIL_PORT = get_configuration_value(
        instance_configuration,
        "EMAIL_PORT",
        587,
    )

    EMAIL_FROM = get_configuration_value(
        instance_configuration,
        "EMAIL_FROM",
        os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>"),
    )

    return (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_FROM,
    )
