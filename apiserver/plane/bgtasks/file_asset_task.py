# Python imports
from datetime import timedelta

# Django imports
from django.utils import timezone
from django.db.models import Q

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import FileAsset


@shared_task
def delete_file_asset():
    # file assets to delete
    file_assets_to_delete = FileAsset.objects.filter(
        Q(is_deleted=True)
        & Q(updated_at__lte=timezone.now() - timedelta(days=7))
    )

    # Delete the file from storage and the file object from the database
    for file_asset in file_assets_to_delete:
        # Delete the file from storage
        file_asset.asset.delete(save=False)
        # Delete the file object
        file_asset.delete()
