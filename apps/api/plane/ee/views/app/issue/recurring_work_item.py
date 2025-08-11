import json
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone

from rest_framework.response import Response
from rest_framework import status

from plane.ee.models import (
    WorkitemTemplate,
    RecurringWorkitemTask,
    RecurringWorkItemTaskActivity,
)
from plane.ee.serializers import (
    WorkitemTemplateSerializer,
    RecurringWorkItemSerializer,
    RecurringWorkItemTaskActivitySerializer,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.app.permissions import allow_permission, ROLE
from plane.ee.views.app.template.base import TemplateBaseEndpoint
from plane.ee.bgtasks.recurring_work_item_activity_task import (
    recurring_work_item_activity,
)


class RecurringWorkItemViewSet(TemplateBaseEndpoint):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)
    def post(self, request, slug, project_id):
        # get the template data
        workitem_blueprint = request.data.pop("workitem_blueprint", {})

        # create a new work_item template
        data = {
            "project_id": project_id,
            **workitem_blueprint,
        }
        # create a new work item template
        serializer = WorkitemTemplateSerializer(data=data)
        if serializer.is_valid():
            work_item_template = serializer.save()
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # create a new recurring work item
        serializer = RecurringWorkItemSerializer(
            data=request.data, context={"project_id": project_id}
        )
        if serializer.is_valid():
            serializer.save(
                workitem_blueprint_id=work_item_template.id, project_id=project_id
            )
            # create a new recurring work item activity
            recurring_work_item_activity.delay(
                type="recurring_workitem.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                recurring_workitem_task_id=str(serializer.data["id"]),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            work_item_template.delete()
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)
    def get(self, request, slug, project_id, pk=None):
        if pk:
            recurring_work_item = RecurringWorkitemTask.objects.get(
                id=pk,
                project_id=project_id,
                workspace__slug=slug,
            )
            serializer = RecurringWorkItemSerializer(recurring_work_item)
            return Response(serializer.data, status=status.HTTP_200_OK)

        recurring_work_items = RecurringWorkitemTask.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
        )
        serializer = RecurringWorkItemSerializer(recurring_work_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)
    def patch(self, request, slug, project_id, pk):

        recurring_work_item = RecurringWorkitemTask.objects.get(
            id=pk,
            project_id=project_id,
            workspace__slug=slug,
        )

        current_instance = json.dumps(
            RecurringWorkItemSerializer(recurring_work_item).data,
            cls=DjangoJSONEncoder,
        )
        request_data = json.dumps(request.data, cls=DjangoJSONEncoder)

        # validate template data
        workitem_blueprint = request.data.pop("workitem_blueprint", {})
        work_item_serializer = None
        if workitem_blueprint:
            success, errors = self.validate_workitem_fields(workitem_blueprint)
            if not success:
                return Response(errors, status=status.HTTP_400_BAD_REQUEST)

            work_item_template = WorkitemTemplate.objects.get(
                workspace__slug=slug,
                id=recurring_work_item.workitem_blueprint_id,
                project_id=project_id,
            )

            work_item_serializer = WorkitemTemplateSerializer(
                work_item_template, data=workitem_blueprint, partial=True
            )
            if not work_item_serializer.is_valid():
                return Response(
                    work_item_serializer.errors, status=status.HTTP_400_BAD_REQUEST
                )

        serializer = RecurringWorkItemSerializer(
            recurring_work_item,
            data=request.data,
            partial=True,
            context={"project_id": project_id},
        )

        if serializer.is_valid():
            serializer.save()
            work_item_serializer.save()
            recurring_work_item_activity.delay(
                type="recurring_workitem.activity.updated",
                requested_data=request_data,
                actor_id=str(request.user.id),
                recurring_workitem_task_id=str(serializer.data["id"]),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            recurring_work_item.refresh_from_db()
            serializer = RecurringWorkItemSerializer(recurring_work_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)
    def delete(self, request, slug, project_id, pk):
        recurring_work_item = RecurringWorkitemTask.objects.get(
            id=pk,
            project_id=project_id,
            workspace__slug=slug,
        )
        # check and delete the periodic task
        if recurring_work_item.periodic_task:
            recurring_work_item.periodic_task.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class RecurringWorkItemActivitiesEndpoint(TemplateBaseEndpoint):

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    @check_feature_flag(FeatureFlag.RECURRING_WORKITEMS)
    def get(self, request, slug, project_id, pk):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        recurring_work_items = RecurringWorkItemTaskActivity.objects.filter(
            project_id=project_id,
            workspace__slug=slug,
            recurring_workitem_task_id=pk,
        ).filter(**filters)

        serializer = RecurringWorkItemTaskActivitySerializer(
            recurring_work_items, many=True
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
