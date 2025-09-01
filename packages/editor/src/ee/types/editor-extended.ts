import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { ExternalEmbedExtensionOptions } from "../extensions/external-embed/types";
import { MathematicsExtensionOptions } from "../extensions/mathematics/types";
import type { TEmbedConfig } from "./issue-embed";

export type IEditorExtensionOptions = {
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]?: Pick<MathematicsExtensionOptions, "onClick">;
  [ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED]?: Pick<ExternalEmbedExtensionOptions, "onClick">;
};

export type IEditorPropsExtended = {
  embedHandler?: TEmbedConfig;
  extensionOptions?: IEditorExtensionOptions;
  isSmoothCursorEnabled: boolean;
};
