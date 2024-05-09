import React, { useState } from "react";
import { useRouter } from "next/router";
import { Trash2 } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// hooks
// ui
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
import { useUser } from "@/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const DeactivateAccountModal: React.FC<Props> = (props) => {
  const router = useRouter();
  const { isOpen, onClose } = props;
  // hooks
  const { deactivateAccount, signOut } = useUser();

  // states
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleClose = () => {
    setIsDeactivating(false);
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeactivating(true);

    await deactivateAccount()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Account deactivated successfully.",
        });
        signOut();
        router.push("/");
        handleClose();
      })
      .catch((err: any) =>
        setToast({
          type: TOAST_TYPE.ERROR,
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
                <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="">
                    <div className="flex items-start gap-x-4">
                      <div className="mt-3 grid place-items-center rounded-full bg-red-500/20 p-2 sm:mt-3 sm:p-2 md:mt-0 md:p-4 lg:mt-0 lg:p-4 ">
                        <Trash2
                          className="h-4 w-4 text-red-600 sm:h-4 sm:w-4 md:h-6 md:w-6 lg:h-6 lg:w-6"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="my-4 text-2xl font-medium leading-6 text-custom-text-100">
                          Deactivate your account?
                        </Dialog.Title>
                        <p className="mt-6 list-disc pr-4 text-base font-normal text-custom-text-200">
                          Once deactivated, you can{"'"}t be assigned issues and be billed for your workspace.To
                          reactivate your account, you will need an invite to a workspace at this email address.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-end gap-2 p-4 sm:px-6">
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
