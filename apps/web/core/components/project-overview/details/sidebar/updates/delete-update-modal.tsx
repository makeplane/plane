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

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { AlertModalCore } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  updateId: string;
  updateOperations: {
    remove: (updateId: string) => Promise<void>;
  };
};

export const ProjectUpdateDeleteModal = observer(function ProjectUpdateDeleteModal(props: Props) {
  const { isOpen, onClose, updateId, updateOperations } = props;
  // states
  const [loader, setLoader] = useState(false);

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
  };

  const handleDeletion = async (updateId: string) => {
    setLoader(true);
    updateOperations.remove(updateId).finally(() => handleClose());
  };

  if (!updateId) return <></>;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(updateId)}
      isSubmitting={loader}
      isOpen={isOpen}
      title="Delete update"
      content={<>Are you sure you want to delete this update? This is an irreversible action.</>}
    />
  );
});
