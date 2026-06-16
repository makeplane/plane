import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.local")
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("COMMIT;")
