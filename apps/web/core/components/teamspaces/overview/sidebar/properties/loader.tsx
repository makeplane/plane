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

// ui
import { Loader } from "@plane/ui";

export function TeamspaceEntitiesLoader({ count }: { count: number }) {
  return (
    <div className="flex flex-col pt-4 w-full h-full">
      <Loader className="w-full h-full flex flex-col gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <Loader.Item height="28px" width="100%" key={index} />
        ))}
      </Loader>
    </div>
  );
}
