/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Loader } from "@plane/ui";

export function IssueActivityLoader() {
  return (
    <Loader className="space-y-8">
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="10px" width="100%" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="10px" width="80%" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Loader.Item className="shrink-0" height="28px" width="28px" />
        <div className="space-y-2 w-full">
          <Loader.Item height="8px" width="60%" />
          <Loader.Item height="8px" width="40%" />
          <Loader.Item height="10px" width="100%" />
        </div>
      </div>
    </Loader>
  );
}
