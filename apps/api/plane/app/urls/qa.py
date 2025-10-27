from django.urls import path
from plane.app.views import PlanAPIView, RepositoryAPIView, CaseModuleAPIView,LabelAPIView

urlpatterns = [
    path('workspaces/<str:slug>/test/plane/', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/plane-assignee', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/label', LabelAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/module', CaseModuleAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/repository/', RepositoryAPIView.as_view(), name='test-repository'),
]