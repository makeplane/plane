import { FC } from "react";
import { useParams } from "next/navigation";
import { Dialog } from "@headlessui/react";
// types
import { IPaymentProduct } from "@plane/types";
// ui
import { EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser } from "@/hooks/store";
// plane web constants
import { ONE_TO_PRO_PLAN_FEATURES } from "@/plane-web/constants/license";
// local components
import { ProPlanUpgrade } from "./pro-plan-upgrade";

export type ProPlanSelfHostUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProPlanSelfHostUpgradeModal: FC<ProPlanSelfHostUpgradeModalProps> = (props) => {
  const { isOpen, handleClose } = props;
  // params
  const { workspaceSlug } = useParams();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  // env
  const PRO_PLAN_MONTHLY_PAYMENT_URL = process.env.NEXT_PUBLIC_PRO_PLAN_MONTHLY_PAYMENT_URL ?? "https://plane.so/pro";
  const PRO_PLAN_YEARLY_PAYMENT_URL = process.env.NEXT_PUBLIC_PRO_PLAN_YEARLY_PAYMENT_URL ?? "https://plane.so/pro";
  // pro product detail for self-hosted users
  const proProduct: IPaymentProduct = {
    id: "pro_product",
    name: "Pro",
    type: "PRO",
    description: "Pro plan details for self-hosted users",
    prices: [
      {
        id: "pro_monthly",
        currency: "usd",
        product: "pro_monthly",
        recurring: "month",
        unit_amount: 0,
        workspace_amount: 0,
      },
      {
        id: "pro_yearly",
        currency: "usd",
        product: "pro_yearly",
        recurring: "year",
        unit_amount: 0,
        workspace_amount: 0,
      },
    ],
  };

  const handlePaymentLink = (priceId: string) => {
    if (!workspaceSlug) return;

    if (!isAdmin) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Unauthorized!",
        message: "You don't have permission to perform this action.",
      });
      return;
    }

    if (priceId === "pro_monthly") {
      window.open(PRO_PLAN_MONTHLY_PAYMENT_URL, "_blank");
    } else if (priceId === "pro_yearly") {
      window.open(PRO_PLAN_YEARLY_PAYMENT_URL, "_blank");
    } else {
      window.open(PRO_PLAN_YEARLY_PAYMENT_URL, "_blank");
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXL} className="rounded-xl">
      <div className="py-6 px-10 max-h-[90vh] overflow-auto">
        <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-6 flex justify-center items-center">
          Upgrade to Pro for 30% flat off.
        </Dialog.Title>
        <div className="mt-3 mb-12">
          <p className="text-center text-sm mb-4 px-10 text-custom-text-100">
            Pro unlocks everything that teams need to track progress and move work forward.Upgrade today and get 30% off
            on your yearly bill.
          </p>
          <p className="text-center text-sm text-custom-primary-200 font-semibold">
            <a href="https://plane.so/pro" target="_blank">
              Learn more
            </a>
          </p>
        </div>
        <ProPlanUpgrade
          proProduct={proProduct}
          basePlan="One"
          features={ONE_TO_PRO_PLAN_FEATURES}
          handlePaymentLink={handlePaymentLink}
        />
      </div>
    </ModalCore>
  );
};
