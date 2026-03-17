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

import { Button } from "@plane/propel/button";
import type { FC } from "react";

type TInviteFormActionsProps = {
  handleClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export const InviteFormActions: FC<TInviteFormActionsProps> = function InviteFormActions(
  props: TInviteFormActionsProps
) {
  const { handleClose, onSubmit, isSubmitting } = props;
  return (
    <div className="border-t border-subtle p-4 flex gap-2 justify-end">
      <Button variant="secondary" onClick={handleClose} size={"lg"}>
        Cancel
      </Button>
      <Button variant="primary" size="lg" onClick={onSubmit} loading={isSubmitting}>
        Invite
      </Button>
    </div>
  );
};
