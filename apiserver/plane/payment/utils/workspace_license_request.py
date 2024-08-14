# Python imports
import requests

# Django imports
from django.conf import settings


def fetch_workspace_license(workspace_id, workspace_slug, free_seats=12):

    # If the number of free seats is less than 12, set it to 12
    workspace_free_seats = 12 if free_seats <= 12 else free_seats

    response = requests.post(
        f"{settings.PAYMENT_SERVER_BASE_URL}/api/products/workspace-products/{str(workspace_id)}/",
        headers={
            "content-type": "application/json",
            "x-api-key": settings.PAYMENT_SERVER_AUTH_TOKEN,
        },
        json={
            "workspace_slug": str(workspace_slug),
            "free_seats": workspace_free_seats,
        },
    )
    response.raise_for_status()
    response = response.json()
    return response
