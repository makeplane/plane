"use client";

import { FC, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
// plane imports
import { Button } from "@plane/ui";
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

export const LicenseFileForm: FC<TLicenseFileFormProps> = observer((props) => {
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
        <div className="space-y-6 flex-shrink-0 border-b border-custom-border-200 pb-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-custom-text-200">Upload a license file</h4>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={cn(
                  "rounded-lg p-6 text-center cursor-pointer transition-colors border border-dashed border-custom-primary-300 bg-custom-primary-100/10",
                  !hasPermission && "cursor-not-allowed opacity-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex items-center justify-center gap-2 text-custom-primary-300 text-xs font-medium">
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
                <div className={cn("border border-custom-border-200 rounded-lg p-4", hasError && "border-red-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="size-5 text-custom-text-300" />
                      <p className="text-sm font-medium text-custom-text-200">{selectedFile.name}</p>
                    </div>
                    <Button type="button" variant="link-danger" size="sm" onClick={removeFile}>
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                {hasError && <div className="text-xs text-red-500">{errors}</div>}
              </>
            )}
          </div>
        </div>
        <InstanceDetailsForLicenseActivation workspaceSlug={workspaceSlug} />
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
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loader || !hasPermission || !selectedFile}>
            {loader ? "Activating..." : "Activate"}
          </Button>
        </div>
      </div>
    </form>
  );
});
