"use client";

import { FC, useState, FormEvent } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button, Input } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useSelfHostedSubscription } from "@/plane-web/hooks/store";

export type TLicenseKeyFormProps = {
  workspaceSlug: string;
  hasPermission: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  handleClose: () => void;
};

export const LicenseKeyForm: FC<TLicenseKeyFormProps> = observer((props) => {
  const { workspaceSlug, hasPermission, onSuccess, onError, handleClose } = props;
  // hooks
  const { activateUsingLicenseKey } = useSelfHostedSubscription();
  // states
  const [activationKey, setActivationKey] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<string | undefined>(undefined);
  const [loader, setLoader] = useState<boolean>(false);

  const handleActivateLicense = async (event: FormEvent<HTMLInputElement>) => {
    setErrors(undefined);
    setActivationKey(event.currentTarget.value);
  };

  const submitActivateLicense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceSlug) return;

    if (!activationKey || activationKey.length <= 0) {
      const errorMessage = "Please enter a valid license key";
      setErrors(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      setLoader(true);
      const subscriptionResponse = await activateUsingLicenseKey(workspaceSlug, activationKey);
      onSuccess?.(subscriptionResponse?.message || "Workspace subscription activated successfully.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error?.error ?? "Your license is invalid or already in use. For any queries contact support@plane.so";
      setErrors(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoader(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submitActivateLicense}>
      <div className="space-y-1 px-4">
        <Input
          id="activity-key"
          type="text"
          name="activity-key"
          placeholder="Enter license key"
          value={activationKey}
          onChange={handleActivateLicense}
          hasError={(errors && Boolean(errors)) || false}
          className={cn("w-full", !hasPermission && "cursor-not-allowed")}
          disabled={!hasPermission}
          autoFocus
        />
        {errors && <div className="text-sm text-red-500">{errors}</div>}
      </div>
      <div className="flex justify-between gap-2 border-t border-custom-border-200 pt-4 px-4">
        <div className="flex items-center gap-2">
          {!hasPermission && (
            <div className="text-xs text-red-500 cursor-help">
              You don&apos;t have permission to perform this action. Please contact the workspace admin.
            </div>
          )}
        </div>
        <div className="flex justify-end items-center gap-2">
          <Button onClick={handleClose} variant="neutral-primary" size="sm" type="button">
            Close
          </Button>
          <Button type="submit" size="sm" disabled={loader || !hasPermission}>
            {loader ? "Activating" : "Activate"}
          </Button>
        </div>
      </div>
    </form>
  );
});
