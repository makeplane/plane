import os
import sys
import django

sys.path.append('/home/adminakashb/Plane/apps/api')
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.local")
django.setup()

from plane.app.serializers.change_management import AssignmentGroupSerializer

data = {"name": "Test Group"}
serializer = AssignmentGroupSerializer(data=data)
if not serializer.is_valid():
    print(serializer.errors)
else:
    print("Valid")
