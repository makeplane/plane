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

import { Link } from "react-router";
// plane imports
import { Button } from "@plane/propel/button";

export function WorkspaceNotAuthorizedPage() {
  return (
    <div className="h-screen w-full overflow-hidden bg-surface-1">
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">Not Authorized!</h3>
            <p className="mx-auto w-1/2 text-13 text-secondary">
              You{"'"}re not a member of this workspace. Please contact the workspace admin to get an invitation or
              check your pending invitations.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Link to="/invitations/">
              <span>
                <Button variant="secondary">Check pending invites</Button>
              </span>
            </Link>
            <Link to="/create-workspace/">
              <span>
                <Button variant="primary">Create new workspace</Button>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
