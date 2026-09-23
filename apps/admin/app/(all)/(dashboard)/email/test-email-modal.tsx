/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
// plane imports
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { Input, InputGroup } from "@makeplane/propel/components/input";
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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    setIsLoading(true);
    await instanceService
      .sendTestEmail(receiverEmail)
      .then(() => {
        setSendEmailStep(ESendEmailSteps.SUCCESS);
        return;
      })
      .catch((err) => {
        setError(err?.error || "Failed to send email");
        setSendEmailStep(ESendEmailSteps.FAILED);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <Dialog
      open={isOpen}
      // The legacy Headless UI dialog closed on outside click and Escape (critic C2): keep both.
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      // Reset once the close animation has finished so the content does not flip while fading out.
      onOpenChangeComplete={(open) => {
        if (!open) resetState();
      }}
    >
      <DialogContent size="md">
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>
                {sendEmailStep === ESendEmailSteps.SEND_EMAIL
                  ? "Send test email"
                  : sendEmailStep === ESendEmailSteps.SUCCESS
                    ? "Email send"
                    : "Failed"}
              </DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <DialogBody>
            {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
              <InputGroup size="lg">
                <Input
                  id="receiver_email"
                  type="email"
                  size="lg"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  placeholder="Receiver email"
                  aria-label="Receiver email"
                  tabIndex={0}
                />
              </InputGroup>
            )}
            {sendEmailStep === ESendEmailSteps.SUCCESS && (
              <div className="flex flex-col gap-y-4 text-13">
                <p>
                  We have sent the test email to {receiverEmail}. Please check your spam folder if you cannot find it.
                </p>
                <p>If you still cannot find it, recheck your SMTP configuration and trigger a new test email.</p>
              </div>
            )}
            {sendEmailStep === ESendEmailSteps.FAILED && <div className="text-13">{error}</div>}
          </DialogBody>
        </DialogMain>
        <DialogActions>
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            onClick={handleClose}
            tabIndex={0}
            label={sendEmailStep === ESendEmailSteps.SEND_EMAIL ? "Cancel" : "Close"}
          />
          {sendEmailStep === ESendEmailSteps.SEND_EMAIL && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              loading={isLoading}
              onClick={handleSubmit}
              tabIndex={0}
              label={isLoading ? "Sending email" : "Send email"}
            />
          )}
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
