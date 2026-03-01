/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { CloseIcon, PageIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
// plane web imports
import { useSelfHostedSubscription } from "@/plane-web/hooks/store";
// local imports
import { InstanceDetailsForLicenseActivation } from "./helper";

export type TLicenseFileFormProps = {
  workspaceSlug: string;
  hasPermission: boolean;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
  handleClose: () => void;
};

export const LicenseFileForm = observer(function LicenseFileForm(props: TLicenseFileFormProps) {
  const { workspaceSlug, hasPermission, onSuccess, onError, handleClose } = props;
  // hooks
  const { activateUsingLicenseFile } = useSelfHostedSubscription();
  // states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string | undefined>(undefined);
  const [loader, setLoader] = useState<boolean>(false);
  // derived
  const hasError = Boolean(errors);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setErrors(undefined);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      // Validate file type
      if (!file.name.endsWith(".json")) {
        setErrors("Please upload a valid license file (.json)");
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    disabled: !hasPermission,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setErrors(undefined);
  };

  const submitActivateLicense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceSlug) return;

    if (!selectedFile) {
      const errorMessage = "Please select a license file";
      setErrors(errorMessage);
      onError?.(errorMessage);
      return;
    }

    try {
      setLoader(true);
      const subscriptionResponse = await activateUsingLicenseFile(workspaceSlug, selectedFile);
      onSuccess?.(subscriptionResponse?.message || "Workspace subscription activated successfully.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error?.error ?? "Your license file is invalid or already in use. For any queries contact support@plane.so";
      setErrors(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoader(false);
    }
  };

  return (
    <form onSubmit={submitActivateLicense}>
      <div className="flex flex-col max-h-[60vh] px-4 overflow-y-auto vertical-scrollbar scrollbar-xs">
        <div className="space-y-6 flex-shrink-0 border-b border-subtle-1 pb-4">
          <div className="space-y-3">
            <h4 className="text-13 font-medium text-secondary">Upload a license file</h4>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  "rounded-lg p-6 text-center cursor-pointer transition-colors border border-dashed border-accent-subtle bg-accent-primary/10",
                  !hasPermission && "cursor-not-allowed opacity-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2 text-accent-secondary text-11 font-medium">
                  <Upload className="size-4" />
                  <p>
                    {isDragActive
                      ? "Drop the license file here"
                      : "Drag & drop or click to browse. Supports .json files."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className={cn("border border-subtle-1 rounded-lg p-4", hasError && "border-danger-strong")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PageIcon className="size-5 text-tertiary" />
                      <p className="text-13 font-medium text-secondary">{selectedFile.name}</p>
                    </div>
                    <Button type="button" variant="error-outline" onClick={removeFile}>
                      <CloseIcon className="size-4" />
                    </Button>
                  </div>
                </div>
                {hasError && <div className="text-caption-sm-medium text-danger-secondary">{errors}</div>}
              </>
            )}
          </div>
        </div>
        <InstanceDetailsForLicenseActivation workspaceSlug={workspaceSlug} />
      </div>
      <div className="flex justify-between gap-2 border-t border-subtle-1 pt-4 px-4">
        <div className="flex items-center gap-2">
          {!hasPermission && (
            <div className="text-caption-sm-medium text-danger-secondary cursor-help">
              You don&apos;t have permission to perform this action. Please contact the workspace admin.
            </div>
          )}
        </div>
        <div className="flex justify-end items-center gap-2">
          <Button onClick={handleClose} variant="secondary" type="button" size="lg">
            Cancel
          </Button>
          <Button type="submit" disabled={loader || !hasPermission || !selectedFile} size="lg">
            {loader ? "Activating" : "Activate"}
          </Button>
        </div>
      </div>
    </form>
  );
});
