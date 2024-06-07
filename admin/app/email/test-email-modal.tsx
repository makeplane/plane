import React, { FC, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, Input } from "@plane/ui";
// services
import { InstanceService } from "@/services/instance.service";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

enum ESendEmailSteps {
  SEND_EMAIL = "SEND_EMAIL",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

const instanceService = new InstanceService();

export const SendTestEmailModal: FC<Props> = (props) => {
  const { isOpen, handleClose } = props;

  // state
  const [receiverEmail, setReceiverEmail] = useState("");
  const [sendEmailStep, setSendEmailStep] = useState<ESendEmailSteps>(ESendEmailSteps.SEND_EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // reset state
  const resetState = () => {
    setReceiverEmail("");
    setSendEmailStep(ESendEmailSteps.SEND_EMAIL);
    setIsLoading(false);
    setError("");
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setIsLoading(true);
    await instanceService
      .sendTestEmail(receiverEmail)
      .then(() => {
        setSendEmailStep(ESendEmailSteps.SUCCESS);
      })
      .catch((error) => {
        setError(error?.error || "Failed to send email");
        setSendEmailStep(ESendEmailSteps.FAILED);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
          <div className="my-10 flex justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 px-4 text-left shadow-custom-shadow-md transition-all w-full sm:max-w-xl">
                <h3 className="text-lg font-medium leading-6 text-custom-text-100">
                  {sendEmailStep === ESendEmailSteps.SEND_EMAIL
                    ? "Send test email"
                    : sendEmailStep === ESendEmailSteps.SUCCESS
                      ? "Email send"
                      : "Failed"}{" "}
                </h3>
                <div className="pt-6 pb-2">
                  {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
                    <Input
                      id="receiver_email"
                      type="email"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      placeholder="Receiver email"
                      className="w-full resize-none text-lg"
                      tabIndex={1}
                    />
                  )}
                  {sendEmailStep === ESendEmailSteps.SUCCESS && (
                    <div className="flex flex-col gap-y-4 text-sm">
                      <p>
                        We have sent the test email to {receiverEmail}. Please check your spam folder if you cannot find
                        it.
                      </p>
                      <p>If you still cannot find it, recheck your SMTP configuration and trigger a new test email.</p>
                    </div>
                  )}
                  {sendEmailStep === ESendEmailSteps.FAILED && <div className="text-sm">{error}</div>}
                  <div className="flex items-center gap-2 justify-end mt-5">
                    <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={2}>
                      {sendEmailStep === ESendEmailSteps.SEND_EMAIL ? "Cancel" : "Close"}
                    </Button>
                    {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
                      <Button variant="primary" size="sm" loading={isLoading} onClick={handleSubmit} tabIndex={3}>
                        {isLoading ? "Sending email..." : "Send email"}
                      </Button>
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
