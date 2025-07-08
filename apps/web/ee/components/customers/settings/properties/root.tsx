import React, { FC } from "react";
import { observer } from "mobx-react";
import { CustomerDefaultProperties, CustomerCustomPropertiesRoot } from "@/plane-web/components/customers/settings";

export const CustomerPropertiesRoot: FC = observer(() => (
  <>
    <CustomerDefaultProperties />
    <CustomerCustomPropertiesRoot />
  </>
));
