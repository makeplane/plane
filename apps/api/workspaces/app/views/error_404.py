# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# views.py
from django.http import JsonResponse


def custom_404_view(request, exception=None):
    return JsonResponse({"error": "Page not found."}, status=404)
