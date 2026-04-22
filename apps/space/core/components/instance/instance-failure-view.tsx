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

import { useTheme } from "@plane/react-theme";
import { Button } from "@plane/propel/button";
// assets
import InstanceFailureDarkImage from "@/app/assets/instance/instance-failure-dark.svg?url";
import InstanceFailureImage from "@/app/assets/instance/instance-failure.svg?url";

export function InstanceFailureView() {
  const { resolvedTheme } = useTheme();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="relative h-screen overflow-x-hidden overflow-y-auto container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <img src={instanceImage} alt="Plane instance failure image" />
          <h3 className="font-medium text-20 text-on-color ">Unable to fetch instance details.</h3>
          <p className="font-medium text-14 text-center">
            We were unable to fetch the details of the instance. <br />
            Fret not, it might just be a connectivity work items.
          </p>
        </div>
        <div className="flex justify-center">
          <Button size="lg" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
