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

from pi.app.api.v1.endpoints import artifacts
from pi.app.api.v1.endpoints import attachments
from pi.app.api.v1.endpoints import chat
from pi.app.api.v1.endpoints import chat_ctas
from pi.app.api.v1.endpoints import dupes
from pi.app.api.v1.endpoints import feedback
from pi.app.api.v1.endpoints import flags
from pi.app.api.v1.endpoints import health
from pi.app.api.v1.endpoints import oauth
from pi.app.api.v1.endpoints import pages
from pi.app.api.v1.endpoints import transcription
from pi.app.api.v1.endpoints.internal import vectorize
from pi.app.api.v1.endpoints.mobile import attachments as mobile_attachments
from pi.app.api.v1.endpoints.mobile import chat as mobile_chat
from pi.app.api.v1.endpoints.mobile import transcription as mobile_transcription

# Router for endpoints
plane_pi_router = APIRouter()

plane_pi_router.include_router(health.router, tags=["health"])
plane_pi_router.include_router(flags.router, tags=["flags"])
plane_pi_router.include_router(dupes.router, prefix="/dupes", tags=["dupes"])
plane_pi_router.include_router(chat.router, prefix="/chat", tags=["chat"])
plane_pi_router.include_router(chat_ctas.router, prefix="/chat-ctas", tags=["chat-ctas"])
plane_pi_router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
plane_pi_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
plane_pi_router.include_router(vectorize.router, prefix="/internal", tags=["internal-vectorize"])
plane_pi_router.include_router(transcription.router, prefix="/transcription", tags=["transcription"])
plane_pi_router.include_router(artifacts.router, prefix="/artifacts", tags=["artifacts"])
plane_pi_router.include_router(pages.router, prefix="/pages", tags=["pages"])
plane_pi_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
# Mobile endpoints
plane_pi_router.include_router(mobile_chat.mobile_router, prefix="/mobile/chat", tags=["mobile/chat"])
plane_pi_router.include_router(mobile_transcription.mobile_router, prefix="/mobile/transcription", tags=["mobile/transcription"])
plane_pi_router.include_router(mobile_attachments.mobile_router, prefix="/mobile/attachments", tags=["mobile/attachments"])
