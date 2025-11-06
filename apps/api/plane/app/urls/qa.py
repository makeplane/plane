from django.urls import path
from plane.app.views import PlanAPIView, RepositoryAPIView, CaseModuleAPIView, LabelAPIView, CaseAPIView,EnumDataAPIView, CaseAttachmentV2Endpoint
from plane.app.views.qa.module import CaseModuleCountAPIView

urlpatterns = [
    path('workspaces/<str:slug>/test/plane/', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/plane-assignee/', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/label/', LabelAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/module/', CaseModuleAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/module/count/', CaseModuleCountAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/', CaseAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/repository/', RepositoryAPIView.as_view(), name='test-repository'),
    path('workspaces/<str:slug>/test/enums/', EnumDataAPIView.as_view(), name='test-repository-enums'),

    # 新增：测试用例附件 V2 路由，与 Issue 附件 V2 路由风格一致
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/cases/<uuid:case_id>/attachments/",
        CaseAttachmentV2Endpoint.as_view(),
        name="case-attachments-v2",
    ),
    path(
        "assets/v2/workspaces/<str:slug>/projects/<uuid:project_id>/cases/<uuid:case_id>/attachments/<uuid:pk>/",
        CaseAttachmentV2Endpoint.as_view(),
        name="case-attachments-v2",
    ),
]