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

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  source: string;
  handleSubmit: (workspaceSlug: string, projectId: string, modalType: string) => Promise<void>;
};

const displayProperties: {
  [key: string]: string;
} = {
  intake_email: "Email",
  intake: "Form",
};

export function RenewModal(props: Props) {
  const { workspaceSlug, projectId, isOpen, onClose, source, handleSubmit } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const onSubmit = async () => {
    setIsLoading(true);

    await handleSubmit(workspaceSlug, projectId, source)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: `${displayProperties[source]} regenerated successfully.`,
        });
        onClose();
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      )
      .finally(() => setIsLoading(false));
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">Renew {displayProperties[source]}</h3>
        <p className="mt-3 text-13 text-secondary">
          {source === "email"
            ? "Changing your email address will block any emails sent to your current one. Are you sure you want to generate a new email?"
            : "Changing the URL will permanently invalidate the current one. Are you sure you want to generate a new URL?"}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" tabIndex={1} onClick={onSubmit} loading={isLoading}>
            {isLoading ? "Renewing..." : `Renew ${source && displayProperties[source]}`}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
