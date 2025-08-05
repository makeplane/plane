// config
import { MathematicsExtensionConfig } from "./extension-config";

type Props = {
  isFlagged: boolean;
};

export const MathematicsExtension = (props: Props) => {
  const { isFlagged } = props;

  return MathematicsExtensionConfig.configure({
    isFlagged,
  });
};
