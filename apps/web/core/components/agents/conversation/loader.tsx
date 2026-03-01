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

export const ConversationLoader = () => {
  return (
    <div className="flex flex-col gap-2 w-full pt-6">
      <div className="w-full flex flex-col gap-2 items-end">
        <Loader>
          <Loader.Item width="100px" height="40px" />
        </Loader>
      </div>
      <Loader>
        <Loader.Item width="100px" height="40px" />
      </Loader>
    </div>
  );
};
