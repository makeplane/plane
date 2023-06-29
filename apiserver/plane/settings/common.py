import os
import datetime
from datetime import timedelta
import ldap
from django.core.management.utils import get_random_secret_key
from django_auth_ldap.config import LDAPSearch, GroupOfNamesType



BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())
LDAP_ENABLED = os.environ.get("LDAP_ENABLED", "0") == "1"


# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    # Inhouse apps
    "plane.analytics",
    "plane.api",
    "plane.bgtasks",
    "plane.db",
    "plane.utils",
    "plane.web",
    "plane.middleware",
    # Third-party things
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "taggit",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "crum.CurrentRequestUserMiddleware",
    "django.middleware.gzip.GZipMiddleware",
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": ("rest_framework.renderers.JSONRenderer",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
}

if LDAP_ENABLED:
    AUTHENTICATION_BACKENDS = (
        'django_auth_ldap.backend.LDAPBackend',
        "django.contrib.auth.backends.ModelBackend",  # default
        # "guardian.backends.ObjectPermissionBackend",
    )
else:
    AUTHENTICATION_BACKENDS = (
        "django.contrib.auth.backends.ModelBackend",  # default
        # "guardian.backends.ObjectPermissionBackend",
    )

ROOT_URLCONF = "plane.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            "templates",
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


JWT_AUTH = {
    "JWT_ENCODE_HANDLER": "rest_framework_jwt.utils.jwt_encode_handler",
    "JWT_DECODE_HANDLER": "rest_framework_jwt.utils.jwt_decode_handler",
    "JWT_PAYLOAD_HANDLER": "rest_framework_jwt.utils.jwt_payload_handler",
    "JWT_PAYLOAD_GET_USER_ID_HANDLER": "rest_framework_jwt.utils.jwt_get_user_id_from_payload_handler",
    "JWT_RESPONSE_PAYLOAD_HANDLER": "rest_framework_jwt.utils.jwt_response_payload_handler",
    "JWT_SECRET_KEY": SECRET_KEY,
    "JWT_GET_USER_SECRET_KEY": None,
    "JWT_PUBLIC_KEY": None,
    "JWT_PRIVATE_KEY": None,
    "JWT_ALGORITHM": "HS256",
    "JWT_VERIFY": True,
    "JWT_VERIFY_EXPIRATION": True,
    "JWT_LEEWAY": 0,
    "JWT_EXPIRATION_DELTA": datetime.timedelta(seconds=604800),
    "JWT_AUDIENCE": None,
    "JWT_ISSUER": None,
    "JWT_ALLOW_REFRESH": False,
    "JWT_REFRESH_EXPIRATION_DELTA": datetime.timedelta(days=7),
    "JWT_AUTH_HEADER_PREFIX": "JWT",
    "JWT_AUTH_COOKIE": None,
}

WSGI_APPLICATION = "plane.wsgi.application"
ASGI_APPLICATION = "plane.asgi.application"

# Django Sites

SITE_ID = 1

# User Model
AUTH_USER_MODEL = "db.User"

# Database

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
    }
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# LDAP Auth Settings
if LDAP_ENABLED:
    # Define the LDAP server details
    AUTH_LDAP_SERVER_URI = os.environ.get("AUTH_LDAP_SERVER_URI", "ldap://localhost:389")

    # Use Start TLS
    AUTH_LDAP_START_TLS = os.environ.get("AUTH_LDAP_START_TLS", "0") == "1"

    # Bind DN and Password
    AUTH_LDAP_BIND_DN = os.environ.get("AUTH_LDAP_BIND_DN", "")
    AUTH_LDAP_BIND_PASSWORD = os.environ.get("AUTH_LDAP_BIND_PASSWORD", "")

    # User and group search bases and filters
    AUTH_LDAP_USER_SEARCH_BASE = os.environ.get("AUTH_LDAP_USER_SEARCH_BASE", "")
    AUTH_LDAP_USER_SEARCH_FILTER = os.environ.get("AUTH_LDAP_USER_SEARCH_FILTER", "")
    AUTH_LDAP_GROUP_SEARCH_BASE = os.environ.get("AUTH_LDAP_GROUP_SEARCH_BASE", "")
    AUTH_LDAP_GROUP_SEARCH_FILTER = os.environ.get("AUTH_LDAP_GROUP_SEARCH_FILTER", "")

    # User attribute mapping
    AUTH_LDAP_USER_ATTR_MAP = {
        "username": os.environ.get("AUTH_LDAP_USER_ATTR_MAP_USERNAME", "uid"),
        "email": os.environ.get("AUTH_LDAP_USER_ATTR_MAP_EMAIL", "mail"),
        "first_name": os.environ.get("AUTH_LDAP_USER_ATTR_MAP_FIRST_NAME", "givenName"),
        "last_name": os.environ.get("AUTH_LDAP_USER_ATTR_MAP_LAST_NAME", "sn"),
    }

    # Required group
    AUTH_LDAP_REQUIRE_GROUP = os.environ.get("AUTH_LDAP_REQUIRE_GROUP", "")

    # Configure LDAP backend
    AUTH_LDAP_USER_SEARCH = LDAPSearch(
        AUTH_LDAP_USER_SEARCH_BASE,
        ldap.SCOPE_SUBTREE,
        AUTH_LDAP_USER_SEARCH_FILTER
    )
    AUTH_LDAP_GROUP_SEARCH = LDAPSearch(
        AUTH_LDAP_GROUP_SEARCH_BASE,
        ldap.SCOPE_SUBTREE,
        AUTH_LDAP_GROUP_SEARCH_FILTER,
    )
    AUTH_LDAP_GROUP_TYPE = GroupOfNamesType()

# Static files (CSS, JavaScript, Images)

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static-assets", "collected-static")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "static"),)

# Media Settings
MEDIA_ROOT = "mediafiles"
MEDIA_URL = "/media/"


# Internationalization

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_L10N = True

USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# Host for sending e-mail.
EMAIL_HOST = os.environ.get("EMAIL_HOST")
# Port for sending e-mail.
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", 587))
# Optional SMTP authentication information for EMAIL_HOST.
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "1") == "1"
EMAIL_USE_SSL = os.environ.get("EMAIL_USE_SSL", "0") == "1"
EMAIL_FROM = os.environ.get("EMAIL_FROM", "Team Plane <team@mailer.plane.so>")


SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=10080),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=43200),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "VERIFYING_KEY": None,
    "AUDIENCE": None,
    "ISSUER": None,
    "JWK_URL": None,
    "LEEWAY": 0,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "USER_AUTHENTICATION_RULE": "rest_framework_simplejwt.authentication.default_user_authentication_rule",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
    "TOKEN_USER_CLASS": "rest_framework_simplejwt.models.TokenUser",
    "JTI_CLAIM": "jti",
    "SLIDING_TOKEN_REFRESH_EXP_CLAIM": "refresh_exp",
    "SLIDING_TOKEN_LIFETIME": timedelta(minutes=5),
    "SLIDING_TOKEN_REFRESH_LIFETIME": timedelta(days=1),
}

CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['application/json']
