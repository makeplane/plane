# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Re-exported so the app and external API share one implementation, including
# workspace scoping of tokens. Do not fork this class again.
from plane.api.middleware.api_authentication import APIKeyAuthentication

__all__ = ["APIKeyAuthentication"]
