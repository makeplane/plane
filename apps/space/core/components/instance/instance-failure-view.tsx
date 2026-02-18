/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import InstanceFailureDarkImage from "@/app/assets/instance/instance-failure-dark.svg?url";
import InstanceFailureImage from "@/app/assets/instance/instance-failure.svg?url";

export function InstanceFailureView() {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="relative h-screen overflow-x-hidden overflow-y-auto container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <img src={instanceImage} alt="Plane instance failure image" />
          <h3 className="font-medium text-20 text-on-color ">{t("admin.instance_failure_title")}</h3>
          <p className="font-medium text-14 text-center">
            {t("admin.instance_failure_description")}
          </p>
        </div>
        <div className="flex justify-center">
          <Button size="lg" onClick={handleRetry}>
            {t("common.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
