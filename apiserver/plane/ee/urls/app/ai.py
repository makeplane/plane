# Django imports
from django.urls import path

from plane.ee.views.app import RephraseGrammarEndpoint


urlpatterns = [
    path(
        "workspaces/<slug:slug>/rephrase-grammar/",
        RephraseGrammarEndpoint.as_view(),
        name="rephrase-grammar",
    ),
]
