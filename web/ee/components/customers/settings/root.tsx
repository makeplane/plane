import { FC } from "react";
import {
  CustomerSettingsDisabled,
  CustomerPropertiesLoader,
  CustomerPropertiesRoot,
} from "@/plane-web/components/customers/settings";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
type TCustomerSettingsRoot = {
  workspaceSlug: string;
  workspaceId: string;
  toggleCustomersFeature: () => void;
  isCustomersFeatureEnabled: boolean;
};

export const CustomerSettingsRoot: FC<TCustomerSettingsRoot> = (props) => {
  const { toggleCustomersFeature, isCustomersFeatureEnabled, workspaceSlug } = props;

  const { loader } = useWorkspaceFeatures();
  return (
    <div className="space-y-3 space-x pt-3">
      {isCustomersFeatureEnabled ? (
        loader ? (
          <CustomerPropertiesLoader />
        ) : (
          <CustomerPropertiesRoot workspaceSlug={workspaceSlug} />
        )
      ) : (
        <CustomerSettingsDisabled toggleCustomersFeature={toggleCustomersFeature} />
      )}
    </div>
  );
};
