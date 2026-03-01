/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { AdminController } from "./admin.controller";
import { BroadcastController } from "./broadcast.controller";
import { CollaborationController } from "./collaboration.controller";
import { ContentController } from "./content.controller";
import { DocumentController } from "./document.controller";
import { HealthController } from "./health.controller";
import { IframelyController } from "./iframely.controller";
import { LiveDocumentController } from "./live-document.controller";
import { MarkdownConversionController } from "./markdown-conversion.controller";
import { PdfExportController } from "./pdf-export.controller";
import { VersionDiffController } from "./version-diff.controller";

export const CONTROLLERS = [
  // Core system controllers (health checks, status endpoints)
  HealthController,
  // Admin operations (protected endpoints)
  AdminController,
  // Document management controllers
  DocumentController,
  LiveDocumentController,
  PdfExportController,
  // Content service
  ContentController,
  IframelyController,
  MarkdownConversionController,
  // Version diff (for page version history)
  VersionDiffController,
  // websocket
  CollaborationController,
  BroadcastController,
];
