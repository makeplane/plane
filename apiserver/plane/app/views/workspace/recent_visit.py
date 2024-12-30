# Module imports
from django.db.models import UserRecentVisit
from .. import BaseViewSet

class UserRecentVisitViewSet(BaseViewSet):
    model = UserRecentVisit