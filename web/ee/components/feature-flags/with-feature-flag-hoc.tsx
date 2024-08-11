import { ReactNode } from "react";
import { observer } from "mobx-react";
// plane web hooks
import { E_FEATURE_FLAGS, useFlag } from "@/plane-web/hooks/store/use-flag";

interface IWithFeatureFlagHOC {
  workspaceSlug: string;
  flag: keyof typeof E_FEATURE_FLAGS;
  fallback: ReactNode;
  children: ReactNode;
}

export const WithFeatureFlagHOC = observer((props: IWithFeatureFlagHOC) => {
  const { workspaceSlug, flag, fallback, children } = props;
  // check if the feature flag is enableds
  const isFeatureEnabled = useFlag(workspaceSlug, flag);
  // return the children if the feature flag is enabled else return the fallback
  return <>{isFeatureEnabled ? children : fallback}</>;
});
