import { observer } from "mobx-react";
import { ReactNode } from "react";
// plane web hooks
import { E_FEATURE_FLAGS, useFlag } from "@/plane-web/hooks/store/use-flag";

interface IWithFeatureFlagHOC {
  flag: keyof typeof E_FEATURE_FLAGS;
  fallback: ReactNode;
  children: ReactNode;
}

export const WithFeatureFlagHOC = observer(({ flag, fallback, children }: IWithFeatureFlagHOC) => {
  const isFeatureEnabled = useFlag(flag);

  return <>{isFeatureEnabled ? children : fallback}</>;
});
