from django.urls import path, include

urlpatterns = [
    path('workspaces/<str:slug>/template/project/', PlanAPIView.as_view(), name='test-plan'),

]