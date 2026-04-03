/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane imports
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { InstanceService } from "@plane/services";

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

export function SendTestEmailModal(props: Props) {
  const { isOpen, handleClose } = props;

  const [receiverEmail, setReceiverEmail] = useState("");
  const [sendEmailStep, setSendEmailStep] = useState<ESendEmailSteps>(ESendEmailSteps.SEND_EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setReceiverEmail("");
    setSendEmailStep(ESendEmailSteps.SEND_EMAIL);
    setIsLoading(false);
    setError("");
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes - delay to avoid cascading renders
      const timer = setTimeout(resetState, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsLoading(true);
    await instanceService
      .sendTestEmail(receiverEmail)
      .then(() => setSendEmailStep(ESendEmailSteps.SUCCESS))
      .catch((err: { error?: string }) => {
        setError(err?.error ?? "Failed to send email");
        setSendEmailStep(ESendEmailSteps.FAILED);
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>
            {sendEmailStep === ESendEmailSteps.SEND_EMAIL
              ? "Send test email"
              : sendEmailStep === ESendEmailSteps.SUCCESS
                ? "Email sent"
                : "Failed"}
          </Dialog.Title>
          <div className="mt-4">
            {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
              <Input
                id="receiver_email"
                type="email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                placeholder="Receiver email"
                className="w-full"
                tabIndex={0}
              />
            )}
            {sendEmailStep === ESendEmailSteps.SUCCESS && (
              <div className="flex flex-col gap-y-4 text-13 text-secondary">
                <p>
                  We have sent the test email to {receiverEmail}. Please check your spam folder if you cannot find it.
                </p>
                <p>If you still cannot find it, recheck your SMTP configuration and trigger a new test email.</p>
              </div>
            )}
            {sendEmailStep === ESendEmailSteps.FAILED && <div className="text-13 text-danger-primary">{error}</div>}
          </div>
          <div className="mt-6 flex items-center gap-2 justify-end">
            <Button variant="secondary" size="lg" onClick={handleClose} tabIndex={0}>
              {sendEmailStep === ESendEmailSteps.SEND_EMAIL ? "Cancel" : "Close"}
            </Button>
            {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
              <Button variant="primary" size="lg" loading={isLoading} onClick={() => void handleSubmit()} tabIndex={0}>
                {isLoading ? "Sending email" : "Send email"}
              </Button>
            )}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
