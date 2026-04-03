/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
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
    <div className="relative container mx-auto flex h-screen items-center justify-center overflow-x-hidden overflow-y-auto px-5">
      <div className="relative w-auto max-w-2xl space-y-8 py-10">
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <img src={instanceImage} alt="Plane instance failure image" />
          <h3 className="text-20 font-medium text-on-color">Unable to fetch instance details.</h3>
          <p className="text-center text-14 font-medium">
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
