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

import type { Extensions } from "@tiptap/core";
import { CustomAttachmentExtensionConfig } from "../attachments/extension-config";
import { CommentsExtensionConfig } from "../comments/extension-config";
import { DrawioExtensionConfig } from "../drawio/extension-config";
import { ExternalEmbedExtensionConfig } from "../external-embed/extension-config";
import { MathematicsExtensionConfig } from "../mathematics/extension-config";
import { MultiColumnExtensionConfig } from "../multi-column/extension-config";
import { PageEmbedExtensionConfig } from "../page-embed/extension-config";
import { CustomAIBlockExtensionConfig } from "../ai-block/extension-config";

export const CoreEditorAdditionalExtensionsWithoutProps: Extensions = [
  ExternalEmbedExtensionConfig,
  CustomAttachmentExtensionConfig,
  MathematicsExtensionConfig,
  MultiColumnExtensionConfig,
  CommentsExtensionConfig,
  DrawioExtensionConfig,
];

export const DocumentEditorAdditionalExtensionsWithoutProps: Extensions = [
  PageEmbedExtensionConfig,
  CustomAIBlockExtensionConfig,
];
