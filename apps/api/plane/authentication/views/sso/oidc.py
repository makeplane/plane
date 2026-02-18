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

# Python imports
import logging
from urllib.parse import urljoin

# Django imports
from django.views import View
from django.http import HttpResponseRedirect

# Module imports
from plane.utils.host import base_host
from plane.authentication.adapter.error import (
    AUTHENTICATION_ERROR_CODES,
    AuthenticationException,
)
from plane.utils.path_validator import get_safe_redirect_url
from plane.authentication.provider.oauth.oidc import OIDCOAuthCloudProvider
from plane.authentication.utils.login import user_login
from plane.authentication.utils.workspace_project_join import process_workspace_project_invitations
from plane.authentication.utils.redirection_path import get_redirection_path
from plane.authentication.utils.group_sync import process_group_sync_on_login


logger = logging.getLogger("plane.authentication")


class OIDCAuthCloudCallbackEndpoint(View):
    """
    This class is used to handle the OIDC authentication callback in the cloud environment.
    """

    def get(self, request, workspace_id):
        # Get the code and state
        code = request.GET.get("code")

        try:
            if not code:
                logger.warning("Code not found in OIDC callback")
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["OIDC_PROVIDER_ERROR"],
                    error_message="OIDC_PROVIDER_ERROR",
                )

            # Get the provider
            provider = OIDCOAuthCloudProvider(request=request, workspace_id=workspace_id, code=code)
            user = provider.authenticate()
            # Login the user and record his device info
            user_login(request=request, user=user)
            # Process workspace and project invitations
            process_workspace_project_invitations(user=user)
            # Process group sync (cloud - syncs for specific workspace)
            process_group_sync_on_login(
                user=user,
                userinfo_response=provider.userinfo_response,
                workspace_id=workspace_id,
                is_cloud=True,
            )
            # Get the redirection path
            path = get_redirection_path(user=user)
            # redirect to referer path
            url = urljoin(base_host(request=request), path)
            return HttpResponseRedirect(url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = get_safe_redirect_url(base_url=base_host(request=request) + "/sso", params=params)
            return HttpResponseRedirect(url)
