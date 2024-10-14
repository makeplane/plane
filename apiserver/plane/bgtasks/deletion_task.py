# Django imports
from django.utils import timezone
from django.apps import apps
from django.conf import settings
from django.db import models
from django.core.exceptions import ObjectDoesNotExist

# Third party imports
from celery import shared_task


@shared_task
def soft_delete_related_objects(
    app_label, model_name, instance_pk, using=None
):
    model_class = apps.get_model(app_label, model_name)
    instance = model_class.all_objects.get(pk=instance_pk)
    related_fields = instance._meta.get_fields()
    for field in related_fields:
        if field.one_to_many or field.one_to_one:
            try:
                # Check if the field has CASCADE on delete
                if (
                    hasattr(field.remote_field, "on_delete")
                    and field.remote_field.on_delete == models.CASCADE
                ):
                    if field.one_to_many:
                        related_objects = getattr(instance, field.name).all()
                    elif field.one_to_one:
                        related_object = getattr(instance, field.name)
                        related_objects = (
                            [related_object]
                            if related_object is not None
                            else []
                        )

                    for obj in related_objects:
                        if obj:
                            obj.deleted_at = timezone.now()
                            obj.save(using=using)
            except ObjectDoesNotExist:
                pass


# @shared_task
def restore_related_objects(app_label, model_name, instance_pk, using=None):
    pass


@shared_task
def hard_delete():

    from plane.db.models import (
        Workspace,
        Project,
        Cycle,
        Module,
        Issue,
        Page,
        IssueView,
        Label,
        State,
        IssueActivity,
        IssueComment,
        IssueLink,
        IssueReaction,
        UserFavorite,
        ModuleIssue,
        CycleIssue,
        Estimate,
        EstimatePoint,
    )

    days = settings.HARD_DELETE_AFTER_DAYS
    # check delete workspace
    _ = Workspace.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete project
    _ = Project.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete cycle
    _ = Cycle.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete module
    _ = Module.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete issue
    _ = Issue.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete page
    _ = Page.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete view
    _ = IssueView.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete label
    _ = Label.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # check delete state
    _ = State.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = IssueActivity.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = IssueComment.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = IssueLink.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = IssueReaction.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = UserFavorite.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = ModuleIssue.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = CycleIssue.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = Estimate.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    _ = EstimatePoint.all_objects.filter(
        deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
    ).delete()

    # at last, check for every thing which ever is left and delete it
    # Get all Django models
    all_models = apps.get_models()

    # Iterate through all models
    for model in all_models:
        # Check if the model has a 'deleted_at' field
        if hasattr(model, "deleted_at"):
            # Get all instances where 'deleted_at' is greater than 30 days ago
            _ = model.all_objects.filter(
                deleted_at__lt=timezone.now() - timezone.timedelta(days=days)
            ).delete()

    return
