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

from .analytic import urlpatterns as analytic_urls
from .api import urlpatterns as api_urls
from .asset import urlpatterns as asset_urls
from .cycle import urlpatterns as cycle_urls
from .estimate import urlpatterns as estimate_urls
from .external import urlpatterns as external_urls
from .intake import urlpatterns as intake_urls
from .issue import urlpatterns as issue_urls
from .module import urlpatterns as module_urls
from .notification import urlpatterns as notification_urls
from .page import urlpatterns as page_urls
from .project import urlpatterns as project_urls
from .search import urlpatterns as search_urls
from .state import urlpatterns as state_urls
from .user import urlpatterns as user_urls
from .views import urlpatterns as view_urls
from .webhook import urlpatterns as webhook_urls
from .workspace import urlpatterns as workspace_urls
from .timezone import urlpatterns as timezone_urls
from .exporter import urlpatterns as exporter_urls

# Integrations URLS
from .importer import urlpatterns as importer_urls
from .integration import urlpatterns as integration_urls

# url patterns
from plane.ee.urls.app import urlpatterns as ee_urls

# agents imports
from plane.agents.urls.app import urlpatterns as agents_app_urls

# runnerctl imports
from plane.runnerctl.urls.app import urlpatterns as runnerctl_app_urls

urlpatterns = [
    *analytic_urls,
    *asset_urls,
    *cycle_urls,
    *estimate_urls,
    *external_urls,
    *intake_urls,
    *issue_urls,
    *module_urls,
    *notification_urls,
    *project_urls,
    *search_urls,
    *state_urls,
    *user_urls,
    *view_urls,
    *workspace_urls,
    *api_urls,
    *webhook_urls,
    *timezone_urls,
    *exporter_urls,
    # ee
    *integration_urls,
    *importer_urls,
    *ee_urls,
    *page_urls,
    *agents_app_urls,
    *runnerctl_app_urls,
]
