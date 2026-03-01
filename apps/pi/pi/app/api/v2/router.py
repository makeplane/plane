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

from fastapi import APIRouter

from pi.app.api.v2.endpoints import actions
from pi.app.api.v2.endpoints import artifacts
from pi.app.api.v2.endpoints import attachments
from pi.app.api.v2.endpoints import chats
from pi.app.api.v2.endpoints import conversations
from pi.app.api.v2.endpoints import dupes
from pi.app.api.v2.endpoints import feedback
from pi.app.api.v2.endpoints import flags
from pi.app.api.v2.endpoints import health
from pi.app.api.v2.endpoints import models
from pi.app.api.v2.endpoints import oauth
from pi.app.api.v2.endpoints import pages
from pi.app.api.v2.endpoints import responses
from pi.app.api.v2.endpoints import templates
from pi.app.api.v2.endpoints import titles
from pi.app.api.v2.endpoints import transcriptions
from pi.app.api.v2.endpoints.internal import vectorize
from pi.app.api.v2.endpoints.mobile import mobile_router

# Router for endpoints
plane_v2_router = APIRouter()


plane_v2_router.include_router(responses.router, prefix="/responses", tags=["responses"])
plane_v2_router.include_router(models.router, prefix="/models", tags=["models"])
plane_v2_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
plane_v2_router.include_router(titles.router, prefix="/titles", tags=["titles"])
plane_v2_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
plane_v2_router.include_router(templates.router, prefix="/templates", tags=["templates"])
plane_v2_router.include_router(chats.router, prefix="/chats", tags=["chats"])
plane_v2_router.include_router(actions.router, prefix="/actions", tags=["actions"])
plane_v2_router.include_router(transcriptions.router, prefix="/transcriptions", tags=["transcriptions"])
plane_v2_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
plane_v2_router.include_router(artifacts.router, prefix="/artifacts", tags=["artifacts"])
plane_v2_router.include_router(dupes.router, prefix="/dupes", tags=["dupes"])
plane_v2_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
plane_v2_router.include_router(pages.router, prefix="/pages", tags=["pages"])
plane_v2_router.include_router(health.router, tags=["health"])
plane_v2_router.include_router(flags.router, tags=["flags"])
plane_v2_router.include_router(vectorize.router, prefix="/internal", tags=["internal"])
plane_v2_router.include_router(mobile_router, prefix="/mobile", tags=["mobile"])
