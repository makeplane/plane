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

// plane imports
import type { TIssue, TPartialProject } from "@plane/types";
// plane web imports
import type { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
// local imports
import type { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import type { AttachmentExtensionOptions } from "../extensions/attachments/types";
import type { DrawioExtensionOptions } from "../extensions/drawio/types";
import type { ExternalEmbedExtensionOptions } from "../extensions/external-embed/types";
import type { MathematicsExtensionOptions } from "../extensions/mathematics/types";
import type { PiChatEditorMentionAttributes } from "../extensions/pi-chat-editor/mention/types";
import type { TCommentConfig } from "./comments";
import type { TEmbedConfig } from "./issue-embed";
import type { CustomAIBlockExtensionProps } from "../extensions/ai-block/types";

export type IEditorExtensionOptions = {
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]?: Pick<MathematicsExtensionOptions, "onClick">;
  [ADDITIONAL_EXTENSIONS.ATTACHMENT]?: Pick<AttachmentExtensionOptions, "onClick">;
  [ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED]?: Pick<ExternalEmbedExtensionOptions, "onClick">;
  [ADDITIONAL_EXTENSIONS.DRAWIO]?: Pick<DrawioExtensionOptions, "onClick">;
};

export type IEditorPropsExtended = {
  embedHandler?: TEmbedConfig;
  extensionOptions?: IEditorExtensionOptions;
  commentConfig?: TCommentConfig;
  isSmoothCursorEnabled: boolean;
  logoSpinner?: React.ComponentType;
  originUrl?: string | null;
  selectionConversion?: {
    createWorkItemCallback: (
      payload: Partial<Pick<TIssue, "name" | "description_html" | "parent_id">>,
      projectId?: string
    ) => Promise<{ id: string } | undefined>;
    isConversionEnabled: boolean;
    projectSelectionEnabled?: {
      projectsList: TPartialProject[];
    };
  };
} & CustomAIBlockExtensionProps;

export type TExtendedEditorCommands =
  | "comment"
  | "block-equation"
  | "inline-equation"
  | "drawio-board"
  | "drawio-diagram"
  | "multi-column";

export type TExtendedCommandExtraProps = {
  attachment: {
    savedSelection: Selection | null;
  };
  "block-equation": {
    latex: string;
  };
  "inline-equation": {
    latex: string;
  };
  "external-embed": {
    src: string;
    [EExternalEmbedAttributeNames.IS_RICH_CARD]: boolean;
  };
  comment: {
    commentId: string;
  };
};

export type TExtendedEditorRefApi = {
  removeComment: (commentId: string) => void;
  setCommentMark: (params: { commentId: string; from: number; to: number }) => void;
  resolveCommentMark: (commentId: string) => void;
  unresolveCommentMark: (commentId: string) => void;
  hoverCommentMarks: (commentIds: string[]) => void;
  selectCommentMark: (commentId: string | null) => void;
  scrollToCommentMark: (commentId: string) => void;
};

export type ICollaborativeDocumentEditorPropsExtended = {
  isSelfHosted?: boolean;
  titleContainerClassName?: string;
  onTitleFocus?: () => void;
};

export type TPiChatEditorApi = {
  addChatContext: (attributes: PiChatEditorMentionAttributes, trailingText?: string) => boolean;
};
