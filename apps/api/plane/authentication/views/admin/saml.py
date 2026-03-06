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
from urllib.parse import urlencode, urljoin

# Django imports
from django.http import HttpResponseRedirect
from django.views import View

# Module imports
from plane.authentication.adapter.saml import SAMLAdapter
from plane.license.models import Instance
from plane.authentication.adapter.error import (
    AuthenticationException,
    AUTHENTICATION_ERROR_CODES,
)
from plane.authentication.utils.host import base_host


class SAMLAuthInitiateAdminEndpoint(View):
    def get(self, request):
        request.session["host"] = base_host(request=request, is_admin=True)
        try:
            # Check instance configuration
            instance = Instance.objects.first()
            if instance is None or not instance.is_setup_done:
                raise AuthenticationException(
                    error_code=AUTHENTICATION_ERROR_CODES["INSTANCE_NOT_CONFIGURED"],
                    error_message="INSTANCE_NOT_CONFIGURED",
                )
            # Provider
            provider = SAMLAdapter(request=request)
            # Get the auth url with RelayState to identify admin flow
            return_url = provider.get_auth_url(return_to="admin")
            return HttpResponseRedirect(return_url)
        except AuthenticationException as e:
            params = e.get_error_dict()
            url = urljoin(
                base_host(request=request, is_admin=True),
                "?" + urlencode(params),
            )
            return HttpResponseRedirect(url)
