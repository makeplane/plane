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

import { FilledCheck, FilledCross } from "@plane/propel/icons";
import { Spinner } from "@plane/ui";

export function Toast(props: { error: string | null; isSaving: boolean }) {
  const { error, isSaving } = props;

  if (isSaving) {
    return (
      <div className="flex justify-center items-center gap-2">
        <Spinner className="size-4" />
        <div>Saving</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center gap-2">
        <FilledCross width={16} height={16} />
        <div>Error</div>
      </div>
    );
  } else {
    return (
      <div className="flex justify-center items-center gap-2">
        <FilledCheck width={16} height={16} className="text-success-primary" />
        <div>Saved</div>
      </div>
    );
  }
}
