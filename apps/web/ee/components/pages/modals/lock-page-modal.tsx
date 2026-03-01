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
// plane imports
import { Switch } from "@plane/propel/switch";
import { getPageName } from "@plane/utils";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { ConfirmationModal } from "./confirmation-modal";

export function LockPageModal({
  page,
  lockPageModal,
  setLockPageModal,
}: {
  page: TPageInstance;
  lockPageModal: boolean;
  setLockPageModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [actionType, setActionType] = useState<boolean>(false);
  const { pageOperations } = usePageOperations({
    page,
  });

  return (
    <ConfirmationModal
      isOpen={lockPageModal}
      onClose={() => setLockPageModal(false)}
      page={page}
      action={async () => pageOperations.toggleLock({ recursive: actionType })}
      title={`${page.is_locked ? "Unlock" : "Lock"} page`}
      contentText={
        <>
          <div>
            Do you want to {page.is_locked ? "unlock" : "lock"} all subpages of page -{" "}
            <span className="wrap-break-word break-all font-medium text-primary">{getPageName(page.name)}</span>?{" "}
            {page.is_locked
              ? "This will allow others to edit this page."
              : "This will prevent others from editing this page."}
          </div>
          <Switch
            className="mt-4"
            value={actionType}
            onChange={() => {
              setActionType((prevActionType) => !prevActionType);
            }}
          />
        </>
      }
      successMessage={`Page ${page.is_locked ? "unlocked" : "locked"} successfully.`}
      errorMessage={`Page could not be ${page.is_locked ? "unlocked" : "locked"}. Please try again.`}
    />
  );
}
