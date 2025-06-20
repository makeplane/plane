# Django imports
from django.utils import timezone
from django.apps import apps
from django.conf import settings
from django.db import models
from django.db.models.fields.related import OneToOneRel


# Third party imports
from celery import shared_task


@shared_task
def soft_delete_related_objects(app_label, model_name, instance_pk, using=None):
    """
    Soft delete related objects for a given model instance
    """
    # Get the model class using app registry
    model_class = apps.get_model(app_label, model_name)

    # Get the instance using all_objects to ensure we can get even if it's already soft deleted
    try:
        instance = model_class.all_objects.get(pk=instance_pk)
    except model_class.DoesNotExist:
        return

    # Get all related fields that are reverse relationships
    all_related = [
        f
        for f in instance._meta.get_fields()
        if (f.one_to_many or f.one_to_one) and f.auto_created and not f.concrete
    ]

    # Handle each related field
    for relation in all_related:
        related_name = relation.get_accessor_name()

        # Skip if the relation doesn't exist
        if not hasattr(instance, related_name):
            continue

        # Get the on_delete behavior name
        on_delete_name = (
            relation.on_delete.__name__
            if hasattr(relation.on_delete, "__name__")
            else ""
        )

        if on_delete_name == "DO_NOTHING":
            continue

        elif on_delete_name == "SET_NULL":
            # Handle SET_NULL relationships
            if isinstance(relation, OneToOneRel):
                # For OneToOne relationships
                related_obj = getattr(instance, related_name, None)
                if related_obj and isinstance(related_obj, models.Model):
                    setattr(related_obj, relation.remote_field.name, None)
                    related_obj.save(update_fields=[relation.remote_field.name])
            else:
                # For other relationships
                related_queryset = getattr(instance, related_name).all()
                related_queryset.update(**{relation.remote_field.name: None})

        else:
            # Handle CASCADE and other delete behaviors
            try:
                if relation.one_to_one:
                    # Handle OneToOne relationships
                    related_obj = getattr(instance, related_name, None)
                    if related_obj:
                        if hasattr(related_obj, "deleted_at"):
                            if not related_obj.deleted_at:
                                related_obj.deleted_at = timezone.now()
                                related_obj.save()
                                # Recursively handle related objects
                                soft_delete_related_objects(
                                    related_obj._meta.app_label,
                                    related_obj._meta.model_name,
                                    related_obj.pk,
                                    using,
                                )
                else:
                    # Handle other relationships
                    related_queryset = getattr(instance, related_name)(
                        manager="objects"
                    ).all()

                    for related_obj in related_queryset:
                        if hasattr(related_obj, "deleted_at"):
                            if not related_obj.deleted_at:
                                related_obj.deleted_at = timezone.now()
                                related_obj.save()
                                # Recursively handle related objects
                                soft_delete_related_objects(
                                    related_obj._meta.app_label,
                                    related_obj._meta.model_name,
                                    related_obj.pk,
                                    using,
                                )
            except Exception as e:
                # Log the error or handle as needed
                print(f"Error handling relation {related_name}: {str(e)}")
                continue

    # Finally, soft delete the instance itself if it hasn't been deleted yet
    if hasattr(instance, "deleted_at") and not instance.deleted_at:
        instance.deleted_at = timezone.now()
        instance.save()


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
