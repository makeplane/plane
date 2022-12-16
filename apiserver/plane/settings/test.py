from __future__ import absolute_import

from .common import * # noqa

DEBUG = True

INSTALLED_APPS.append("plane.tests")

if os.environ.get('GITHUB_WORKFLOW'):
    DATABASES = {
        'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'github_actions',
           'USER': 'postgres',
           'PASSWORD': 'postgres',
           'HOST': '127.0.0.1',
           'PORT': '5432',
        }
    }
else:
    DATABASES = {
        'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'plane_test',
           'USER': 'postgres',
           'PASSWORD': 'password123',
           'HOST': '127.0.0.1',
           'PORT': '5432',
        }
    }

REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_URL = False

RQ_QUEUES = {
    "default": {
        "HOST": "localhost",
        "PORT": 6379,
        "DB": 0,
        "DEFAULT_TIMEOUT": 360,
    },
}

WEB_URL = "http://localhost:3000"
