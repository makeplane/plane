import { FC } from "react";
import { observer } from "mobx-react";
import {
  CustomerSettingsDisabled,
  CustomerPropertiesLoader,
  CustomerPropertiesRoot,
} from "@/plane-web/components/customers/settings";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { useCustomerProperties } from "@/plane-web/hooks/store/customers/use-customer-properties";
import {} from "mobx";

type TCustomerSettingsRoot = {
  workspaceId: string;
  toggleCustomersFeature: () => void;
  isCustomersFeatureEnabled: boolean;
};

export const CustomerSettingsRoot: FC<TCustomerSettingsRoot> = observer((props) => {
  const { toggleCustomersFeature, isCustomersFeatureEnabled } = props;

  const { loader } = useWorkspaceFeatures();
  const { loader: customerPropertiesLoader } = useCustomerProperties();
  // derived values
  const isLoader = loader || customerPropertiesLoader;
  return (
    <div className="space-y-3 space-x pt-3">
      {isCustomersFeatureEnabled ? (
        isLoader ? (
          <CustomerPropertiesLoader />
        ) : (
          <CustomerPropertiesRoot />
        )
      ) : (
        <CustomerSettingsDisabled toggleCustomersFeature={toggleCustomersFeature} />
      )}
    </div>
  );
});
