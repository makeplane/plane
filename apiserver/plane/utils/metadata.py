# Python imports
import requests
import uuid

# Django imports
from django.core.files.base import ContentFile

# Third party imports
from bs4 import BeautifulSoup
import favicon

# Module imports
from plane.db.models import FileAsset


def get_metadata(url, workspace_id):
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an HTTPError for bad responses

        # Parse the HTML content
        soup = BeautifulSoup(response.content, "html.parser")

        # Extract metadata
        metadata = {
            "title": soup.title.string if soup.title else "N/A",
            "description": "",
            "logo": "",
        }

        # Extract meta tags
        meta_tags = soup.find_all("meta")
        for tag in meta_tags:
            if "name" in tag.attrs:
                if tag.attrs["name"].lower() == "description":
                    metadata["description"] = tag.attrs["content"]
                elif tag.attrs["name"].lower() == "keywords":
                    metadata["keywords"] = tag.attrs["content"]
            elif (
                "property" in tag.attrs
                and tag.attrs["property"].lower() == "og:description"
            ):
                metadata["description"] = tag.attrs["content"]

        # Extract favicon
        icons = favicon.get(url, timeout=3)

        # Download the favicon
        if icons:
            favicon_response = requests.get(icons[0].url)
            content = ContentFile(
                favicon_response.content,
                name=uuid.uuid4().hex,
            )

            # Save the favicon as an asset
            asset = FileAsset.objects.create(
                asset=content,
                attributes={"type": "favicon"},
                workspace_id=workspace_id,
            )
            metadata["logo"] = str(asset.asset)

        return metadata
    except requests.exceptions.RequestException as e:
        return {}
