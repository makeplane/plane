import React, { useState, useEffect } from "react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// icons
import { XCircleIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
// ui
import { CircularProgress } from "components/ui";
// types
import type { ICurrentUserResponse, IWorkspace } from "types";

declare global {
  interface Window {
    supabase: any;
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  user: ICurrentUserResponse | undefined;
  issueNumber: number;
};

const UpgradeToProModal: React.FC<Props> = ({ isOpen, onClose, user, issueNumber }) => {
  const [supabaseClient, setSupabaseClient] = useState<any>(null);

  useEffect(() => {
    // Create a Supabase client
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createClient } = window.supabase;
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      if (supabase) {
        setSupabaseClient(supabase);
      }
    }
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    onClose();
    setIsLoading(false);
  };

  const proFeatures = [
    "Everything in free",
    "Unlimited users",
    "Unlimited file uploads",
    "Priority Support",
    "Custom Theming",
    "Access to Roadmap",
    "Plane AI (GPT unlimited)",
  ];

  const [errorMessage, setErrorMessage] = useState("");
  const [loader, setLoader] = useState(false);
  const submitEmail = async () => {
    setLoader(true);
    const payload = { email: user?.email || "" };

    if (supabaseClient) {
      if (payload?.email) {
        const emailExists = await supabaseClient
          .from("web-waitlist")
          .select("id,email,count")
          .eq("email", payload?.email);
        if (emailExists.data.length === 0) {
          const emailCreation = await supabaseClient
            .from("web-waitlist")
            .insert([{ email: payload?.email, count: 1, last_visited: new Date() }])
            .select("id,email,count");
          if (emailCreation.status === 201) setErrorMessage("success");
          else setErrorMessage("insert_error");
        } else {
          const emailCountUpdate = await supabaseClient
            .from("web-waitlist")
            .upsert({
              id: emailExists.data[0]?.id,
              count: emailExists.data[0]?.count + 1,
              last_visited: new Date(),
            })
            .select("id,email,count");
          if (emailCountUpdate.status === 201) setErrorMessage("email_already_exists");
          else setErrorMessage("update_error");
        }
      } else setErrorMessage("email_required");
    } else setErrorMessage("supabase_error");

    setLoader(false);
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-brand-base bg-brand-base text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <div className="flex flex-wrap">
                  <div className="w-full md:w-3/5 p-6 flex flex-col gap-y-6">
                    <div className="flex gap-2">
                      <div
                        className={`font-semibold outline-none text-sm mt-1.5 ${
                          issueNumber >= 750
                            ? "text-red-600"
                            : issueNumber >= 500
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                        title="Shortcuts"
                      >
                        <CircularProgress
                          progress={
                            (issueNumber / 1024) * 100 > 100 ? 100 : (issueNumber / 1024) * 100
                          }
                        />
                      </div>
                      <div className="">
                        <div className="font-semibold text-lg">Upgrade to pro</div>
                        <div className="text-brand-secondary text-sm">
                          This workspace has used {issueNumber} of its 1024 issues creation limit (
                          {((issueNumber / 1024) * 100).toFixed(2)}%).
                        </div>
                      </div>
                      <div
                        onClick={handleClose}
                        className="w-5 h-5 text-brand-secondary cursor-pointer mt-1.5 md:hidden block ml-auto"
                      >
                        <XCircleIcon />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-6">
                      <div
                        className={`font-semibold outline-none text-sm mt-1.5 w-5 h-5 text-[#892FFF] flex-shrink-0`}
                        title="Shortcuts"
                      >
                        <RocketLaunchIcon />
                      </div>
                      <div className="">
                        <div className="font-semibold text-lg">Order summary</div>
                        <div className="text-brand-secondary text-sm">
                          Priority support, file uploads, and access to premium features.
                        </div>

                        <div className="flex flex-wrap my-4">
                          {proFeatures.map((feature, index) => (
                            <div key={index} className="w-1/2 py-2 flex gap-2 my-1.5">
                              <div className="w-5 h-5 mt-0.5 text-green-600">
                                <CheckCircleIcon />
                              </div>
                              <div>{feature}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-2/5 bg-brand-surface-1 p-6 flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-lg">Summary</div>
                      <div
                        onClick={handleClose}
                        className="w-5 h-5 text-brand-secondary cursor-pointer mt-1.5 hidden md:block"
                      >
                        <XCircleIcon />
                      </div>
                    </div>
                    <div className="text-brand-secondary text-sm mt-4">
                      Plane application is currently in dev-mode. We will soon introduce Pro plans
                      once general availability has been established. Stay tuned for more updates.
                      In the meantime, Plane remains free and unrestricted.
                      <br /> <br />
                      We{"'"}ll ensure a smooth transition from the community version to the Pro
                      plan for you.
                    </div>
                    <button
                      disabled={loader}
                      onClick={() => submitEmail()}
                      type="button"
                      className="mt-5 md:mt-auto whitespace-nowrap max-w-min items-center gap-x-1 rounded-md px-3 py-2 font-medium outline-none text-sm bg-brand-accent text-white"
                    >
                      {loader ? "Loading.." : " Join waitlist"}
                    </button>
                    {errorMessage && (
                      <div
                        className={`mt-1 text-sm ${
                          errorMessage === "Successfully registered."
                            ? "text-green-500"
                            : " text-red-500"
                        }`}
                      >
                        {errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default UpgradeToProModal;
