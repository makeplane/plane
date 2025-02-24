import React, { FC } from "react";
import { CustomerDefaultProperties, CustomerCustomPropertiesRoot } from "@/plane-web/components/customers/settings";
type TCustomPropertiesRootProps = {
  workspaceSlug: string;
};

export const CustomerPropertiesRoot: FC<TCustomPropertiesRootProps> = (props) => {
  const { workspaceSlug } = props;

  return (
    <>
      <CustomerDefaultProperties />
      <CustomerCustomPropertiesRoot />
    </>
  );
};
