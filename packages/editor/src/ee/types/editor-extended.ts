import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { MathematicsExtensionOptions } from "../extensions/mathematics/types";
import type { TEmbedConfig } from "./issue-embed";

export type IEditorExtensionOptions = {
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]?: Pick<MathematicsExtensionOptions, "onClick">;
};

export type IEditorPropsExtended = {
  embedHandler?: TEmbedConfig;
  extensionOptions?: IEditorExtensionOptions;
  isSmoothCursorEnabled: boolean;
};
