/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useInstanceUser } from "@/hooks/store";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export function ResetPasswordDialog({ open, onClose, userId }: Props) {
  const { resetUserPassword } = useInstanceUser();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const result = await resetUserPassword(userId);
      setGeneratedPassword(result.password);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to reset password" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPassword) return;
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGeneratedPassword(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>Reset Password</Dialog.Title>
          <div className="mt-4 space-y-4">
            {!generatedPassword ? (
              <p className="text-13 text-color-secondary">
                This will generate a new random password for this user. The current password will be invalidated.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-13 text-color-success-primary font-medium">Password reset successfully!</p>
                <div className="flex items-center gap-2 rounded-md border border-color-subtle bg-layer-1 p-3">
                  <code className="flex-1 text-13 font-mono">{generatedPassword}</code>
                  <button
                    onClick={() => void handleCopy()}
                    className="p-1.5 rounded hover:bg-layer-1-hover"
                    aria-label="Copy password"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-color-success-primary" />
                    ) : (
                      <Copy className="h-4 w-4 text-color-secondary" />
                    )}
                  </button>
                </div>
                <p className="text-11 text-color-tertiary">
                  Copy and share this password securely. It won&apos;t be shown again.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              {generatedPassword ? "Close" : "Cancel"}
            </Button>
            {!generatedPassword && (
              <Button variant="error-fill" onClick={() => void handleReset()} loading={isLoading}>
                Reset Password
              </Button>
            )}
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
