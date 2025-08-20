import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { MathematicsExtensionOptions } from "../extensions/mathematics/types";

export type IEditorExtensionOptions = {
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]?: Pick<MathematicsExtensionOptions, "onClick">;
};

export type IEditorPropsExtended = {
  extensionOptions?: IEditorExtensionOptions;
  isSmoothCursorEnabled: boolean;
};
