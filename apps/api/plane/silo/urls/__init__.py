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

# add all the url patterns in this folder
# from .application_secret import urlpatterns as application_secret_urls
from .asset import urlpatterns as asset_urls
from .credential import urlpatterns as credential_urls
from .connection import urlpatterns as connection_urls
from .entity_connection import urlpatterns as entity_connection_urls
from .importer import urlpatterns as importer_urls
from .importer_report import urlpatterns as importer_report_urls
from .import_execution_log import urlpatterns as import_execution_log_urls
from .page import urlpatterns as page_urls
from .releases import urlpatterns as releases_urls
from .work_item_property import urlpatterns as work_item_property_urls

urlpatterns = [
    *asset_urls,
    *credential_urls,
    *connection_urls,
    *entity_connection_urls,
    *importer_urls,
    *importer_report_urls,
    *import_execution_log_urls,
    *page_urls,
    *releases_urls,
    *work_item_property_urls,
]
