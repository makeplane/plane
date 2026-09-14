/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// ui
import { Button } from "@plane/propel/button";
import { BRAND_NAME, SUPPORT_EMAIL, SUPPORT_URL } from "@plane/constants";

function ErrorPage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="grid h-screen place-items-center bg-surface-1 p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Yikes! That doesn{"'"}t look good.</h3>
          <p className="mx-auto text-13 text-secondary md:w-1/2">
            {BRAND_NAME} encountered an unexpected error. Please retry, or contact your administrator if the problem
            continues.
            {(SUPPORT_URL || SUPPORT_EMAIL) && " You can reach support at "}
            {SUPPORT_URL && (
              <a href={SUPPORT_URL} target="_blank" className="text-accent-primary" rel="noopener noreferrer">
                {SUPPORT_URL}
              </a>
            )}
            {SUPPORT_URL && SUPPORT_EMAIL && " or "}
            {SUPPORT_EMAIL && (
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-primary">
                {SUPPORT_EMAIL}
              </a>
            )}
            {(SUPPORT_URL || SUPPORT_EMAIL) && "."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="primary" size="lg" onClick={handleRetry}>
            Refresh
          </Button>
          {/* <Button variant="secondary" size="lg" onClick={() => {}}>
            Sign out
          </Button> */}
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
