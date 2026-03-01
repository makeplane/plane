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

import type { FC, ReactNode } from "react";
import React, { useCallback, useState } from "react";
import type { FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useFileSize } from "@/plane-web/hooks/use-file-size";
// helpers
import { useAttachmentOperations } from "./helper";

type TProps = {
  requestId: string;
  workspaceSlug: string;
  customerId: string;
  disabled: boolean;
  children: ReactNode;
};

export function AddAttachmentButton(props: TProps) {
  const { requestId, workspaceSlug, customerId, disabled, children } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [isLoading, setIsLoading] = useState(false);
  // file size
  const { maxFileSize } = useFileSize();
  // operations
  const { operations: attachmentOperations } = useAttachmentOperations(workspaceSlug, customerId, requestId);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      const totalAttachedFiles = acceptedFiles.length + rejectedFiles.length;

      if (rejectedFiles.length === 0) {
        const currentFile: File = acceptedFiles[0];
        if (!currentFile || !workspaceSlug) return;

        setIsLoading(true);
        attachmentOperations.create(currentFile).finally(() => {
          setIsLoading(false);
        });
        return;
      }

      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("customers.requests.toasts.attachment.size.error.title"),
        message:
          totalAttachedFiles > 1
            ? t("customers.requests.toasts.attachment.size.error.message")
            : t("customers.requests.toasts.attachment.length.error.message", { size: maxFileSize / 1024 / 1024 }),
      });
      return;
    },
    [attachmentOperations, maxFileSize, workspaceSlug]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxSize: maxFileSize,
    multiple: false,
    disabled: isLoading || disabled,
  });
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <button {...getRootProps()} type="button" disabled={disabled}>
        <input {...getInputProps()} />
        {children}
      </button>
    </div>
  );
}
