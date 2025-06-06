from .intake import urlpatterns as intake_patterns
from .page import urlpatterns as page_patterns
from .views import urlpatterns as views_patterns
from plane.payment.urls import space_urlpatterns as payment_space_patterns

urlpatterns = [
    *intake_patterns,
    *page_patterns,
    *views_patterns,
    *payment_space_patterns,
]
