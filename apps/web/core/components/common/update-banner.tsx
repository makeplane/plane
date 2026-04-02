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

import { Banner } from "@plane/propel/banner";
import { Button } from "@plane/propel/button";
import { InfoIcon } from "@plane/propel/icons";
// hooks
import { useServiceWorker } from "@/hooks/use-service-worker";

export function UpdateBanner() {
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  return (
    <Banner
      variant="accent"
      icon={<InfoIcon />}
      title="A new version of Plane is available. Refresh to get the latest updates."
      action={
        <Button variant="secondary" onClick={updateServiceWorker}>
          Refresh
        </Button>
      }
    />
  );
}
