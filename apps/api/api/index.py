# Vercel Serverless Function Handler for Django
# Using mangum adapter for ASGI compatibility

import os
import sys

# Add the plane app to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.vercel")

# Import Django and initialize
import django
django.setup()

from mangum import Mangum
from django.core.asgi import get_asgi_application

# Get Django ASGI application
django_app = get_asgi_application()

# Wrap with Mangum for AWS Lambda/Vercel compatibility
handler = Mangum(django_app, lifespan="off")
