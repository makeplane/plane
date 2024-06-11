import { FC, Fragment, useState } from "react";
// icons
import { CheckCircle } from "lucide-react";
// ui
import { Dialog, Transition, Tab } from "@headlessui/react";
// store
import { useEventTracker } from "@/hooks/store";

function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

const PRICING_CATEGORIES = ["Monthly", "Yearly"];

const MONTHLY_PLAN_ITEMS = [
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

export type ProPlanModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const ProPlanModal: FC<ProPlanModalProps> = (props) => {
  const { isOpen, handleClose } = props;
  // store
  const { captureEvent } = useEventTracker();
  // states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tabIndex, setTabIndex] = useState(0);

  const handleProPlaneMonthRedirection = () => {
    if (process.env.NEXT_PUBLIC_PRO_PLAN_MONTHLY_REDIRECT_URL) {
      window.open(process.env.NEXT_PUBLIC_PRO_PLAN_MONTHLY_REDIRECT_URL, "_blank");
      captureEvent("pro_plan_modal_month_redirection", {});
    }
  };

  const handleProPlanYearlyRedirection = () => {
    if (process.env.NEXT_PUBLIC_PRO_PLAN_YEARLY_REDIRECT_URL) {
      window.open(process.env.NEXT_PUBLIC_PRO_PLAN_YEARLY_REDIRECT_URL, "_blank");
      captureEvent("pro_plan_modal_yearly_redirection", {});
    }
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
                <Dialog.Title as="h2" className="text-2xl font-bold leading-6 mt-4 flex justify-center items-center">
                  Early-adopter pricing for believers
                </Dialog.Title>
                <div className="mt-2 mb-5">
                  <p className="text-center text-sm mb-6 px-10 text-custom-text-200">
                    Build Plane to your specs. You decide what we prioritize and build for everyone. Also get tailored
                    onboarding + implementation and priority support.
                  </p>
                  <Tab.Group>
                    <div className="flex w-full justify-center">
                      <Tab.List className="flex space-x-1 rounded-xl bg-custom-background-80 p-1 w-[72%]">
                        {PRICING_CATEGORIES.map((category, index) => (
                          <Tab
                            key={category}
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
                              {category}
                              {category === "Yearly" && (
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
                      <Tab.Panel className={classNames("rounded-xl bg-custom-background-100 p-3")}>
                        <p className="ml-4 text-4xl font-bold mb-2">
                          $7
                          <span className="text-sm ml-3 text-custom-text-300">/user/month</span>
                        </p>
                        <ul>
                          {MONTHLY_PLAN_ITEMS.map((item) => (
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
                            <div className="absolute transition-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt" />
                            <button
                              type="button"
                              className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-medium border-custom-border-100 border-[1.5px] transition-all duration-200 bg-custom-background-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-border-200"
                              onClick={handleProPlaneMonthRedirection}
                            >
                              Become Early Adopter
                            </button>
                          </div>
                        </div>
                      </Tab.Panel>
                      <Tab.Panel className={classNames("rounded-xl bg-custom-background-100 p-3")}>
                        <p className="ml-4 text-4xl font-bold mb-2">
                          $5
                          <span className="text-sm ml-3 text-custom-text-300">/user/month</span>
                        </p>
                        <ul>
                          {YEARLY_PLAN_ITEMS.map((item) => (
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
                            <div className="absolute transition-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-xl blur-lg group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200 animate-tilt" />
                            <button
                              type="button"
                              className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-medium border-custom-border-100 border-[1.5px] transition-all duration-200 bg-custom-background-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-border-200"
                              onClick={handleProPlanYearlyRedirection}
                            >
                              Become Early Adopter
                            </button>
                          </div>
                        </div>
                      </Tab.Panel>
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
