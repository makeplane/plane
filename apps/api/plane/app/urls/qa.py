from django.urls import path, include
from rest_framework.routers import SimpleRouter

from plane.app.views import PlanAPIView, RepositoryAPIView, CaseModuleAPIView, LabelAPIView, CaseAPIView, \
    EnumDataAPIView, CaseAttachmentV2Endpoint, CaseDetailAPIView, PlanView, PlanModuleAPIView, PlanCaseAPIView
from plane.app.views.qa.case import CaseAssetAPIView, CaseIssueWithType, TestCaseCommentAPIView, CaseAPI, \
    CaseLabelAPIView
from plane.app.views.qa.module import CaseModuleCountAPIView
from plane.app.views.qa.review import ReviewModuleAPIView, CaseReviewAPIView,CaseReviewView

router = SimpleRouter()
router.register('review', CaseReviewView, basename='review')
router.register('plan', PlanView, basename='plan')
router.register('case', CaseAPI, basename='case')

urlpatterns = [
    path('workspaces/<str:slug>/test/plane/', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/plane/case/', PlanCaseAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/plan/module/', PlanModuleAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/plane-assignee/', PlanAPIView.as_view(), name='test-plan'),
    path('workspaces/<str:slug>/test/module/', CaseModuleAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/module/count/', CaseModuleCountAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/', CaseAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/issues/', CaseIssueWithType.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/label/', LabelAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/<uuid:case_id>/', CaseDetailAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/case/<uuid:case_id>/assets/', CaseAssetAPIView.as_view(), name='test-case'),
    path('workspaces/<str:slug>/test/repository/', RepositoryAPIView.as_view(), name='test-repository'),
    path('workspaces/<str:slug>/test/enums/', EnumDataAPIView.as_view(), name='test-repository-enums'),
    path('workspaces/<str:slug>/test/review/module/', ReviewModuleAPIView.as_view(), name='test-repository-enums'),
    path('workspaces/<str:slug>/test/review/', CaseReviewAPIView.as_view(), name='test-repository-enums'),
    path('workspaces/<str:slug>/test/', include(router.urls)),
    path(
        "workspaces/<str:slug>/cases/<uuid:case_id>/attachments/<uuid:pk>/",
        CaseAttachmentV2Endpoint.as_view(),
        name="case-attachments-v2",
    ),
    path('workspaces/<str:slug>/test/comments/', TestCaseCommentAPIView.as_view(), name='test-comments'),
    path('workspaces/<str:slug>/test/comments/<uuid:id>/', TestCaseCommentAPIView.as_view(),
         name='test-comments-detail'),
]
