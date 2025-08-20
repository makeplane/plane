// local imports
import { MathematicsExtensionConfig } from "./extension-config";
import type { MathematicsExtensionOptions } from "./types";

type Props = MathematicsExtensionOptions;

export const MathematicsExtension = (props: Props) => {
  const { isFlagged, onClick } = props;

  return MathematicsExtensionConfig.configure({
    isFlagged,
    onClick,
  });
};
