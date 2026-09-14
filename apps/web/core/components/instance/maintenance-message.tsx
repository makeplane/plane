/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_URL } from "@plane/constants";

export function MaintenanceMessage() {
  const supportHref = SUPPORT_URL || (SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : "");

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-left text-18 font-semibold text-primary">
          &#x1F6A7; Looks like {BRAND_NAME} didn&apos;t start up correctly!
        </h1>
        <span className="text-left text-14 font-medium text-secondary">
          Some services might have failed to start. Please check your container logs to identify and resolve the issue.
          If you&apos;re stuck, contact your administrator for more help.
        </span>
      </div>
      {supportHref && (
        <div className="mt-1 flex items-center justify-start gap-6">
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-13 text-accent-primary hover:underline"
          >
            Contact Support
          </a>
        </div>
      )}
    </>
  );
}
