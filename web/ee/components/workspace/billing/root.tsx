import { observer } from "mobx-react";
// hooks
import { useInstance } from "@/hooks/store";
// plane web components
import { PlaneOneBilling, PlaneCloudBilling } from "@/plane-web/components/license";

export const BillingRoot = observer(() => {
  // store hooks
  const { instance } = useInstance();

  if (instance?.product === "plane-one") {
    return <PlaneOneBilling />;
  }

  return <PlaneCloudBilling />;
});
