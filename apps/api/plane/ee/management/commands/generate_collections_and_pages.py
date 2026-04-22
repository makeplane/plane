# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Django imports
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Max

# Module imports
from plane.db.models import Page, Workspace
from plane.ee.models import Collection, PageCollection
from plane.utils.html_processor import strip_tags

SORT_ORDER_INCREMENT = 10000
BULK_CREATE_BATCH_SIZE = 1000


class Command(BaseCommand):
    help = """
    Generate collections with nested pages for testing.

    Creates N collections in a workspace, each with M pages.
    Pages are nested up to D levels deep.

    Usage:
        python manage.py generate_collections_and_pages <workspace_slug> <user_email> \\
            --collections 5 --pages 10 --depth 3
    """

    def add_arguments(self, parser):
        parser.add_argument("workspace_slug", type=str, help="Slug of the workspace")
        parser.add_argument("user_email", type=str, help="Email of the page/collection owner")
        parser.add_argument("--collections", type=int, default=5, help="Number of collections to create (default: 5)")
        parser.add_argument("--pages", type=int, default=10, help="Number of pages per collection (default: 10)")
        parser.add_argument("--depth", type=int, default=2, help="Max nesting depth for pages (default: 2)")

    def handle(self, *args, **options):
        workspace_slug = options["workspace_slug"]
        user_email = options["user_email"]
        num_collections = options["collections"]
        num_pages = options["pages"]
        max_depth = options["depth"]

        # Validate inputs
        if num_collections < 1 or num_pages < 1 or max_depth < 1:
            raise CommandError("collections, pages, and depth must all be >= 1")

        # Fetch workspace
        try:
            workspace = Workspace.objects.get(slug=workspace_slug)
        except Workspace.DoesNotExist:
            raise CommandError(f"Workspace with slug '{workspace_slug}' not found.")

        # Fetch user
        User = get_user_model()
        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise CommandError(f"User with email '{user_email}' not found.")

        self.stdout.write(
            f"Generating {num_collections} collections × {num_pages} pages "
            f"(depth={max_depth}) in workspace '{workspace_slug}' for user '{user_email}'..."
        )

        total_pages = 0

        with transaction.atomic():
            collections = self._create_collections(
                workspace=workspace,
                user=user,
                num_collections=num_collections,
            )

            for c_idx, collection in enumerate(collections, start=1):
                pages_created = self._create_nested_pages(
                    workspace_id=workspace.id,
                    user_id=user.id,
                    collection_id=collection.id,
                    num_pages=num_pages,
                    max_depth=max_depth,
                    collection_idx=c_idx,
                )
                total_pages += pages_created

                self.stdout.write(f"  Collection {c_idx}: '{collection.name}' — {pages_created} pages created")

        total_collections = len(collections)

        self.stdout.write(
            self.style.SUCCESS(f"\nDone! Created {total_collections} collections and {total_pages} total pages.")
        )

    def _create_collections(self, workspace, user, num_collections):
        """Create all collections up front with explicit sort orders."""
        largest_sort_order = Collection.objects.filter(workspace_id=workspace.id).aggregate(largest=Max("sort_order"))[
            "largest"
        ]

        next_sort_order = (
            largest_sort_order + SORT_ORDER_INCREMENT
            if largest_sort_order is not None
            else Collection._meta.get_field("sort_order").default
        )

        collections = []
        for c_idx in range(1, num_collections + 1):
            collections.append(
                Collection(
                    name=f"Test Collection {c_idx}",
                    workspace_id=workspace.id,
                    owned_by_id=user.id,
                    created_by_id=user.id,
                    updated_by_id=user.id,
                    sort_order=next_sort_order,
                )
            )
            next_sort_order += SORT_ORDER_INCREMENT

        Collection.objects.bulk_create(collections, batch_size=BULK_CREATE_BATCH_SIZE)
        return collections

    def _create_nested_pages(self, workspace_id, user_id, collection_id, num_pages, max_depth, collection_idx):
        """
        Create pages distributed across nesting levels and link them to the collection.

        Every page (root or child) gets a PageCollection entry pointing to the same
        collection — this matches how the app creates pages via the serializer.

        Example with 6 pages, depth=3:
          Page 1 (root)
            Page 2 (child of 1)
              Page 3 (child of 2)
          Page 4 (root)
            Page 5 (child of 4)
              Page 6 (child of 5)
        """
        pages = []
        page_collections = []
        pages_created = 0
        page_idx = 1
        sort_order = SORT_ORDER_INCREMENT

        while pages_created < num_pages:
            # Build one "branch" from root down to max_depth
            parent_id = None
            for depth in range(1, max_depth + 1):
                if pages_created >= num_pages:
                    break

                description_html = f"<p>Auto-generated page {page_idx} at depth {depth}</p>"

                page = Page(
                    name=f"C{collection_idx} Page {page_idx} (depth {depth})",
                    workspace_id=workspace_id,
                    owned_by_id=user_id,
                    created_by_id=user_id,
                    updated_by_id=user_id,
                    parent_id=parent_id,
                    is_global=True,
                    access=Page.PUBLIC_ACCESS,
                    description_html=description_html,
                    description_stripped=strip_tags(description_html),
                )
                pages.append(page)

                page_collections.append(
                    PageCollection(
                        collection_id=collection_id,
                        page_id=page.id,
                        workspace_id=workspace_id,
                        sort_order=sort_order,
                        created_by_id=user_id,
                        updated_by_id=user_id,
                    )
                )
                sort_order += SORT_ORDER_INCREMENT

                parent_id = page.id
                pages_created += 1
                page_idx += 1

        Page.objects.bulk_create(pages, batch_size=BULK_CREATE_BATCH_SIZE)
        PageCollection.objects.bulk_create(page_collections, batch_size=BULK_CREATE_BATCH_SIZE)

        return pages_created
