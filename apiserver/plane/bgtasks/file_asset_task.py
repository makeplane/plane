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


@shared_task
def file_asset_size(slug, email, members, issue_count, cycle_count, module_count):
    asset_size = []
    # s3_client = boto3.client('s3')
    assets_to_update = []

    # for asset in FileAsset.objects.filter(size__isnull=True):
    #     try:
    #         key = f"{workspace_id}/{asset_key}"
    #         response = s3_client.head_object(Bucket=settings.AWS_STORAGE_BUCKET_NAME, Key=key)
    #         size = response['ContentLength']
    #         asset.size = size
    #         assets_to_update.append(asset)
    #     except Exception as e:
    #         # Handle exceptions such as S3 object not found
    #         print(f"Error updating asset size for {asset.asset.key}: {e}")

    # # Bulk update only objects that need updating
    # FileAsset.objects.bulk_update(assets_to_update, ["size"], batch_size=50)
    
    for asset in FileAsset.objects.filter(size__isnull=True):
        asset.size = asset.asset.size
        asset_size.append(asset)

    FileAsset.objects.bulk_update(asset_size, ["size"], batch_size=50)
    print("File asset size updated successfully")
