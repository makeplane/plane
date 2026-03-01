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
import { CloseIcon } from "@plane/propel/icons";

export default function ErrorBanner({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 text-danger-primary bg-danger-subtle rounded-md p-2">
      <span className="text-13">{message}</span>
      <Button variant="ghost" onClick={onClose}>
        <CloseIcon height={14} width={14} className="text-danger-primary" />
      </Button>
    </div>
  );
}

export { ErrorBanner };
