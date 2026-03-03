# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import csv
import io
import re

# Third party imports
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

# Module imports
from plane.db.models import User
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers.user import InstanceUserSerializer
from plane.license.api.views.base import BaseAPIView

# CSV column config
REQUIRED_COLUMNS = {"first_name", "last_name", "email", "password"}
MAX_ROWS = 500
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")


class InstanceUserBulkImportEndpoint(BaseAPIView):
    """Bulk import users from CSV file.

    CSV format: first_name, last_name, email, password
    Skips invalid rows, imports valid ones, returns summary.
    """

    permission_classes = [InstanceAdminPermission]
    parser_classes = [MultiPartParser]

    def post(self, request):
        csv_file = request.FILES.get("file")
        if not csv_file:
            return Response(
                {"error": "No CSV file provided. Upload with key 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size (max 5MB)
        if csv_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum 5MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file type
        if not csv_file.name.endswith(".csv"):
            return Response(
                {"error": "File must be a .csv file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            content = csv_file.read().decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(content))
        except Exception:
            return Response(
                {"error": "Failed to parse CSV file. Ensure it is UTF-8 encoded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate headers
        if not reader.fieldnames or not REQUIRED_COLUMNS.issubset(set(reader.fieldnames)):
            missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
            return Response(
                {"error": f"Missing required columns: {', '.join(sorted(missing))}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        skipped = []
        existing_emails = set(
            User.objects.values_list("email", flat=True)
        )

        for row_number, row in enumerate(reader, start=2):  # row 1 = header
            if row_number > MAX_ROWS + 1:
                skipped.append({"row_number": row_number, "email": "", "reason": f"Exceeds max {MAX_ROWS} rows"})
                break

            email = (row.get("email") or "").strip().lower()
            first_name = (row.get("first_name") or "").strip()
            last_name = (row.get("last_name") or "").strip()
            password = (row.get("password") or "").strip()

            # Validate row
            if not email:
                skipped.append({"row_number": row_number, "email": email, "reason": "Empty email"})
                continue
            if not EMAIL_REGEX.match(email):
                skipped.append({"row_number": row_number, "email": email, "reason": "Invalid email format"})
                continue
            if not first_name:
                skipped.append({"row_number": row_number, "email": email, "reason": "Empty first_name"})
                continue
            if len(password) < 8:
                skipped.append({"row_number": row_number, "email": email, "reason": "Password must be at least 8 characters"})
                continue
            if email in existing_emails:
                skipped.append({"row_number": row_number, "email": email, "reason": "Email already exists"})
                continue

            try:
                user = User.objects.create(
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    username=email,
                )
                user.set_password(password)
                user.is_password_autoset = False
                user.save()

                existing_emails.add(email)
                created.append(InstanceUserSerializer(user).data)
            except Exception as e:
                skipped.append({"row_number": row_number, "email": email, "reason": str(e)})

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "total_created": len(created),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
