import { FC, Fragment, useState } from "react";
import orderBy from "lodash/orderBy";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { CheckCircle } from "lucide-react";
import { Dialog, Transition, Tab } from "@headlessui/react";
// types
import { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// store
import { useEventTracker, useUser } from "@/hooks/store";
// services
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export const MONTHLY_PLAN_ITEMS = [
  "White-glove onboarding for your use-cases",
  "Bespoke implementation",
  "Priority integrations",
  "Priority Support and SLAs",
  "Early access to all paid features",
  "Locked-in discount for a whole year",
];

const YEARLY_PLAN_ITEMS = [
  "White-glove onboarding for your use-cases",
  "Bespoke implementation",
  "Priority integrations",
  "Priority Support and SLAs",
  "Early access to all paid features",
  "Tiered discounts for the second and third years",
];

export type CloudProductsModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const CloudProductsModal: FC<CloudProductsModalProps> = (props) => {
  const { isOpen, handleClose } = props;
  // params
  const { workspaceSlug } = useParams();
  // store
  const { captureEvent } = useEventTracker();
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // fetch products
  const { data } = useSWR(
    workspaceSlug ? "CLOUD_PAYMENT_PRODUCTS" : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
    }
  );
  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");
  const proProductPrices = orderBy(proProduct?.prices || [], ["recurring"], ["asc"]);
  // states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tabIndex, setTabIndex] = useState(0);
  const [isLoading, setLoading] = useState(false);
  // derived values
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

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

    setLoading(true);
    captureEvent("pro_plan_payment_link_clicked", { workspaceSlug });
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: priceId,
        product_id: proProduct?.id,
      })
      .then((response) => {
        if (response.payment_link) {
          window.open(response.payment_link, "_blank");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
        handleClose();
      });
  };

  const getPlaneFeatureItems = (recurringType: string) => {
    if (recurringType === "month") {
      return MONTHLY_PLAN_ITEMS;
    }
    if (recurringType === "year") {
      return YEARLY_PLAN_ITEMS;
    }
    return [];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-custom-background-100 p-6 text-left align-middle shadow-xl transition-all border-[0.5px] border-custom-border-100">
                <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-6 flex justify-center items-center">
                  Early-adopter pricing for believers
                </Dialog.Title>
                <div className="mt-3 mb-6">
                  <p className="text-center text-sm mb-6 px-10 text-custom-text-100">
                    Build Plane to your specs. You decide what we prioritize and build for everyone. Also get tailored
                    onboarding + implementation and priority support.
                  </p>
                  <Tab.Group>
                    <div className="flex w-full justify-center">
                      <Tab.List className="flex space-x-1 rounded-xl bg-custom-background-80 p-1 w-[72%]">
                        {proProductPrices.map((price: IPaymentProductPrice, index: number) => (
                          <Tab
                            key={price?.id}
                            className={({ selected }) =>
                              classNames(
                                "w-full rounded-lg py-2 text-sm font-medium leading-5",
                                "ring-white/60 ring-offset-2 ring-offset-custom-primary-90 focus:outline-none",
                                selected
                                  ? "bg-custom-background-100 text-custom-primary-100 shadow"
                                  : "hover:bg-custom-background-80 text-custom-text-300 hover:text-custom-text-100"
                              )
                            }
                            onClick={() => setTabIndex(index)}
                          >
                            <>
                              {price.recurring === "month" && ("Monthly" as string)}
                              {price.recurring === "year" && ("Annual" as string)}
                              {price.recurring === "year" && (
                                <span className="bg-custom-primary-100 text-white rounded-full px-2 py-1 ml-1 text-xs">
                                  -28%
                                </span>
                              )}
                            </>
                          </Tab>
                        ))}
                      </Tab.List>
                    </div>

                    <Tab.Panels className="mt-2">
                      {proProductPrices?.map((price: IPaymentProductPrice, index: number) => (
                        <Tab.Panel key={index} className={classNames("rounded-xl bg-custom-background-100 p-3")}>
                          <p className="ml-4 text-4xl font-bold mb-2">
                            {price.recurring === "month" && "$7"}
                            {price.recurring === "year" && "$5"}
                            <span className="text-sm ml-3 text-custom-text-300">/user/month</span>
                          </p>
                          <ul className="px-2">
                            {getPlaneFeatureItems(price.recurring).map((item) => (
                              <li key={item} className="relative rounded-md p-3 flex">
                                <p className="text-sm font-medium leading-5 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-4" />
                                  <span>{item}</span>
                                </p>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-center w-full">
                            <div className="relative inline-flex group mt-8">
                              <div className="absolute transition-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#3F76FF] to-[#3F76FF] rounded-xl blur-md group-hover:opacity-80 group-hover:-inset-1 group-hover:duration-200 animate-tilt" />
                              <button
                                type="button"
                                className="relative inline-flex items-center justify-center px-8 py-3 text-sm font-medium border-custom-border-100 border-[1.5px] transition-all duration-200 bg-custom-background-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-border-200"
                                onClick={() => handlePaymentLink(price.id)}
                                disabled={isLoading}
                              >
                                {isLoading ? "Redirecting to Stripe..." : "Become Early Adopter"}
                              </button>
                            </div>
                          </div>
                        </Tab.Panel>
                      ))}
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
