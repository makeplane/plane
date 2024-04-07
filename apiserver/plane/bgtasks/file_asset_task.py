# Python imports
from datetime import timedelta

# Third party imports
from celery import shared_task

# Django imports
from django.db.models import Q
from django.utils import timezone

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


@shared_task
def file_asset_size():
    asset_size = []
    for asset in FileAsset.objects.filter(size__isnull=True):
        asset.size = asset.asset.size
        asset_size.append(asset)

    FileAsset.objects.bulk_update(asset_size, ["size"], batch_size=50)
    print("File asset size updated successfully")
