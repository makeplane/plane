import { FC, Fragment, useState } from "react";
import { Dialog, Transition, Tab } from "@headlessui/react";
import { CheckCircle } from "lucide-react";
import { useMobxStore } from "lib/mobx/store-provider";

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
  const {
    trackEvent: { captureEvent },
  } = useMobxStore();
  // states
  const [tabIndex, setTabIndex] = useState(0);

  const handleProPlaneMonthRedirection = () => {
    if (process.env.PRO_PLAN_MONTHLY_REDIRECT_URL) {
      window.open(process.env.PRO_PLAN_MONTHLY_REDIRECT_URL, "_blank");
      captureEvent("pro_plan_modal_month_redirection");
    }
  };

  const handleProPlanYearlyRedirection = () => {
    if (process.env.PRO_PLAN_YEARLY_REDIRECT_URL) {
      window.open(process.env.PRO_PLAN_YEARLY_REDIRECT_URL, "_blank");
      captureEvent("pro_plan_modal_yearly_redirection");
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
          <div className="fixed inset-0 bg-black/25" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h2"
                  className="text-2xl font-bold leading-6 text-gray-900 mt-4 flex justify-center items-center"
                >
                  Early-adopter pricing for believers
                </Dialog.Title>
                <div className="mt-2 mb-5">
                  <p className="text-center text-sm mb-6 px-10">
                    Build Plane to your specs. You decide what we prioritize and build for everyone. Also get tailored
                    onboarding + implementation and priority support.
                  </p>
                  <Tab.Group>
                    <div className="flex w-full justify-center">
                      <Tab.List className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-[72%]">
                        {PRICING_CATEGORIES.map((category, index) => (
                          <Tab
                            key={category}
                            className={({ selected }) =>
                              classNames(
                                "w-full rounded-lg py-2 text-sm font-medium leading-5 text-slate-800",
                                "ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none",
                                selected
                                  ? "bg-white text-blue-700 shadow"
                                  : "text-blue-100 hover:bg-white/[0.12] hover:text-slate-600"
                              )
                            }
                            onClick={() => setTabIndex(index)}
                          >
                            <>
                              {category}
                              {category === "Yearly" && (
                                <span className=" bg-blue-500 text-white rounded-full px-2 py-1 ml-1 text-xs">
                                  -28%
                                </span>
                              )}
                            </>
                          </Tab>
                        ))}
                      </Tab.List>
                    </div>

                    <Tab.Panels className="mt-2">
                      <Tab.Panel className={classNames("rounded-xl bg-white p-3")}>
                        <p className="ml-4 text-4xl font-bold mb-2">
                          $7
                          <span className="text-sm ml-3 text-slate-600">/user/month</span>
                        </p>
                        <ul>
                          {MONTHLY_PLAN_ITEMS.map((item) => (
                            <li key={item} className="relative rounded-md p-3 flex">
                              <p className="text-sm font-medium leading-5 flex items-center">
                                <CheckCircle height="16px" className="mr-4" />
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
                              className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-slate-900 border-slate-200 border-[1.5px] transition-all duration-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
                              onClick={handleProPlaneMonthRedirection}
                            >
                              Become Early Adopter
                            </button>
                          </div>
                        </div>
                      </Tab.Panel>
                      <Tab.Panel className={classNames("rounded-xl bg-white p-3")}>
                        <p className="ml-4 text-4xl font-bold mb-2">
                          $5
                          <span className="text-sm ml-3 text-slate-600">/user/month</span>
                        </p>
                        <ul>
                          {YEARLY_PLAN_ITEMS.map((item) => (
                            <li key={item} className="relative rounded-md p-3 flex">
                              <p className="text-sm font-medium leading-5 flex items-center">
                                <CheckCircle height="16px" className="mr-4" />
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
                              className="relative inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-slate-900 border-slate-600 transition-all duration-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
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
