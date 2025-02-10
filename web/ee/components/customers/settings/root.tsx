import { FC } from "react";
import { CustomerSettingsDisabled, CustomerPropertiesLoader } from "@/plane-web/components/customers/settings";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
type TCustomerSettingsRoot = {
  workspaceSlug: string;
  workspaceId: string;
  toggleCustomersFeature: () => void;
  isCustomersFeatureEnabled: boolean;
};

export const CustomerSettingsRoot: FC<TCustomerSettingsRoot> = (props) => {
  const { toggleCustomersFeature, isCustomersFeatureEnabled } = props;

  const { loader } = useWorkspaceFeatures();
  return (
    <div className="space-y-3 space-x">
      {isCustomersFeatureEnabled ? (
        loader ? (
          <CustomerPropertiesLoader />
        ) : (
          <></>
        )
      ) : (
        <CustomerSettingsDisabled toggleCustomersFeature={toggleCustomersFeature} />
      )}
    </div>
  );
};
