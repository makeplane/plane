import { FC } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

type TCustomerSettingsDisabled = {
  toggleCustomersFeature: () => void;
};
export const CustomerSettingsDisabled: FC<TCustomerSettingsDisabled> = (props) => {
  const { toggleCustomersFeature } = props;
  // hooks
  const { t } = useTranslation();

  // derived values
  const resolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/customers/customers-disabled",
    extension: "webp",
  });

  return (
    <DetailedEmptyState
      title=""
      assetPath={resolvedPath}
      primaryButton={{ text: t("customers.settings.enable"), onClick: () => toggleCustomersFeature() }}
      className="h-fit min-h-full items-start !p-0"
    />
  );
};
