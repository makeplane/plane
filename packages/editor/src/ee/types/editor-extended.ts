import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { ExternalEmbedExtensionOptions } from "../extensions/external-embed/types";
import { MathematicsExtensionOptions } from "../extensions/mathematics/types";
import { TCommentConfig } from "./comments";
import type { TEmbedConfig } from "./issue-embed";

export type IEditorExtensionOptions = {
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]?: Pick<MathematicsExtensionOptions, "onClick">;
  [ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED]?: Pick<ExternalEmbedExtensionOptions, "onClick">;
};

export type IEditorPropsExtended = {
  embedHandler?: TEmbedConfig;
  extensionOptions?: IEditorExtensionOptions;
  commentConfig?: TCommentConfig;
  isSmoothCursorEnabled: boolean;
};

export type TExtendedEditorCommands = "comment" | "block-equation" | "inline-equation";

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
};
