# add all the url patterns in this folder
from .application_secret import urlpatterns as application_secret

urlpatterns = [
    *application_secret,
]
