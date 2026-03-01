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

import { Loader } from "@plane/ui";

export function UpdatesLoader() {
  return (
    <Loader className="flex flex-col gap-4 py-4">
      <Loader.Item height="125px" width="100%" />
      <Loader.Item height="125px" width="100%" />
      <Loader.Item height="125px" width="100%" />
    </Loader>
  );
}
