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

# django imports
from django.conf import settings
from django.urls import path

# module imports
from plane.graphql.schema import schema
from plane.graphql.views import CustomGraphQLView

urlpatterns = [
    path("", CustomGraphQLView.as_view(schema=schema, graphql_ide="graphiql" if settings.DEBUG else None)),
]
