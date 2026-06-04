import os
import sys
import jwt
import django

sys.path.append('/home/adminakashb/Plane/apps/api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'plane.settings.local')
django.setup()

from plane.utils.email_auth import get_oauth2_access_token

token = get_oauth2_access_token()
if token:
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("Token Roles:", decoded.get('roles', []))
    print("Token Scopes:", decoded.get('scp', ''))
else:
    print("No token")
