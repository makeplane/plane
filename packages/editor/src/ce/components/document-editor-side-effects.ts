/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import type { ReactElement } from "react";
import type { IEditorPropsExtended } from "@/types";

export type DocumentEditorSideEffectsProps = {
  editor: Editor;
  id: string;
  updatePageProperties?: unknown;
  extendedEditorProps?: IEditorPropsExtended;
};

export const DocumentEditorSideEffects = (_props: DocumentEditorSideEffectsProps): ReactElement | null => null;
