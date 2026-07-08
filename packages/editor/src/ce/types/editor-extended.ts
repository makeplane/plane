/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TSlashCommandAdditionalOption } from "@/extensions/slash-commands/root";
import type { TPageEmbedWidgetCallback } from "@/extensions/page-embed/types";

export type IEditorExtensionOptions = unknown;

export type IEditorPropsExtended = {
  /** Renders the clickable page card inside the page-embed node view (supplied by the host app). */
  pageEmbedWidgetCallback?: TPageEmbedWidgetCallback;
  /** Extra slash-command entries injected by the host app (e.g. "/page"). */
  additionalSlashCommandOptions?: TSlashCommandAdditionalOption[];
};

export type ICollaborativeDocumentEditorPropsExtended = unknown;

export type TExtendedEditorCommands = never;

export type TExtendedCommandExtraProps = unknown;

export type TExtendedEditorRefApi = unknown;
