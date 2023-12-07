import React, { useState } from "react";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Dialog, Transition } from "@headlessui/react";
import { Trash2 } from "lucide-react";
import { mutate } from "swr";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Button } from "@plane/ui";
// hooks
import useToast from "hooks/use-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeactivateAccountModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;

  // states
  const [isDeactivating, setIsDeactivating] = useState(false);

  const {
    user: { deactivateAccount },
  } = useMobxStore();

  const router = useRouter();

  const { setToastAlert } = useToast();
  const { setTheme } = useTheme();

  const handleClose = () => {
    setIsDeactivating(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Account deactivated successfully.",
        });
        mutate("CURRENT_USER_DETAILS", null);
        setTheme("system");
        router.push("/");
        handleClose();
      })
      .catch((err) =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error,
        })
      )
      .finally(() => setIsDeactivating(false));
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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="">
                    <div className="flex items-start gap-x-4">
                      <div className="grid place-items-center rounded-full bg-red-500/20 p-4">
                        <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-2xl my-4 font-medium leading-6 text-custom-text-100">
                          Deactivate your account?
                        </Dialog.Title>
                        <p className="pr-4 mt-6 text-custom-text-200 list-disc font-normal text-base">
                          Once deactivated, you can{"'"}t be assigned issues and be billed for your workspace.To
                          reactivate your account, you will need an invite to a workspace at this email address.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 p-4 mb-2 sm:px-6">
                  <Button variant="neutral-primary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDeleteAccount}>
                    {isDeactivating ? "Deactivating..." : "Confirm"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
