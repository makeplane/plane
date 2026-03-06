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

import { useContext } from "react";
// ui
import { Button } from "@plane/propel/button";
// store
import { StoreContext } from "@/lib/store-provider";

function ErrorPage() {
  const store = useContext(StoreContext);
  const isSelfManaged = store?.instance?.config?.is_self_managed ?? true;

  return (
    <div className="bg-surface-1 grid h-screen place-items-center p-4">
      <div className="space-y-8 text-center">
        <div className="space-y-2">
          <h3 className="text-16 font-semibold">Something went wrong{isSelfManaged ? "" : "."}</h3>
          <p className="mx-auto md:w-1/2 text-13 text-secondary">
            We{"'"}ve encountered an unexpected error
            {!isSelfManaged && " and our team has been automatically notified"}. Please try reloading the page. If this
            issue persists, reach out to{" "}
            <a href="mailto:support@plane.so" className="text-accent-primary">
              support@plane.so
            </a>{" "}
            or visit our{" "}
            <a href="https://forum.plane.so" target="_blank" rel="noopener noreferrer" className="text-accent-primary">
              community forum
            </a>{" "}
            for assistance.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ErrorPage;
