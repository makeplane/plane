import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// assets
import CustomerDisabledDark from "@/public/empty-state/customers/customers-disabled-dark.webp";
import CustomerDisabledLight from "@/public/empty-state/customers/customers-disabled-light.webp";

type TCustomerSettingsDisabled = {
  toggleCustomersFeature: () => void;
};
export const CustomerSettingsDisabled: FC<TCustomerSettingsDisabled> = (props) => {
  const { toggleCustomersFeature } = props;
  // hooks
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="w-[600px] m-auto mt-12">
      <Image
        src={resolvedTheme === "dark" ? CustomerDisabledDark : CustomerDisabledLight}
        alt={"Customers disabled"}
        className="my-4"
        width={384}
        height={250}
        layout="responsive"
        lazyBoundary="100%"
      />
      <Button onClick={toggleCustomersFeature} className="m-auto">
        {t("customers.settings.enable")}
      </Button>
    </div>
  );
};
