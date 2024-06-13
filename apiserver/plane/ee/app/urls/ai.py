# Django imports
from django.urls import path

from plane.ee.app.views import RephraseGrammarEndpoint


urlpatterns = [
    path(
        "workspaces/<slug:slug>/rephrase-grammar/",
        RephraseGrammarEndpoint.as_view(),
        name="rephrase-grammar",
    ),
]
