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

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extensions } from "@tiptap/core";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import type { IEditorPropsExtended } from "@/plane-editor/types/editor-extended";
// types
import type { TExternalEmbedConfig } from "@/types";
// ce imports
import type { TCoreAdditionalExtensionsProps } from "src/ce/extensions";
// local imports
import { CustomAttachmentExtension } from "../attachments/extension";
import { ExternalEmbedExtension } from "../external-embed/extension";
import { MathematicsExtension } from "../mathematics/extension";
import { SmoothCursorExtension } from "../smooth-cursor";
import { MultiColumnExtension } from "../multi-column/extension";

type Props = TCoreAdditionalExtensionsProps & { extendedEditorProps?: IEditorPropsExtended } & {
  provider: HocuspocusProvider | undefined;
  isEditable?: boolean;
};

export const CoreEditorAdditionalExtensions = (props: Props): Extensions => {
  const { flaggedExtensions, extendedEditorProps, disabledExtensions, fileHandler, isEditable } = props;
  const { extensionOptions } = extendedEditorProps ?? {};
  const { embedHandler, isSmoothCursorEnabled } = extendedEditorProps ?? {};
  const extensions: Extensions = [];
  extensions.push(
    MathematicsExtension({
      isFlagged: !!flaggedExtensions?.includes("mathematics"),
      ...extensionOptions?.[ADDITIONAL_EXTENSIONS.MATHEMATICS],
    })
  );

  const widgetCallback: TExternalEmbedConfig["widgetCallback"] =
    embedHandler?.externalEmbedComponent?.widgetCallback ?? (() => null);
  if (!disabledExtensions?.includes("external-embed")) {
    extensions.push(
      ExternalEmbedExtension({ isFlagged: !!flaggedExtensions?.includes("external-embed"), widgetCallback })
    );
  }
  if (!disabledExtensions?.includes("multi-column")) {
    extensions.push(
      MultiColumnExtension({
        isFlagged: !!flaggedExtensions?.includes("multi-column"),
      })
    );
  }
  if (isSmoothCursorEnabled) {
    extensions.push(SmoothCursorExtension);
  }

  if (!disabledExtensions?.includes("attachments")) {
    extensions.push(
      CustomAttachmentExtension({
        fileHandler,
        isFlagged: !!flaggedExtensions?.includes("attachments"),
        isVideoAttachmentsFlagged: !!flaggedExtensions?.includes("video-attachments"),
        isEditable: !!isEditable,
      }).configure({
        onClick: extendedEditorProps?.extensionOptions?.attachmentComponent?.onClick,
      })
    );
  }

  return extensions;
};
