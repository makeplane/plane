# Django imports
from django.urls import path

# Module imports
from plane.ee.views.app import RephraseGrammarEndpoint


urlpatterns = [
    path(
        "workspaces/<slug:slug>/rephrase-grammar/",
        RephraseGrammarEndpoint.as_view(),
        name="rephrase-grammar",
    )
]
