"""
WSGI config for plane project.

It exposes the WSGI callable as a module-level variable named ``application``.

"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file before Django setup
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / '.env')

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

application = get_wsgi_application()
