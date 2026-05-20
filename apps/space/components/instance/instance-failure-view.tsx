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

const handleRetry = () => {
  window.location.reload();
};

export function InstanceFailureView() {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  return (
    <div className="relative container mx-auto flex h-screen items-center justify-center overflow-x-hidden overflow-y-auto px-5">
      <div className="relative w-auto max-w-2xl space-y-8 py-10">
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <img src={instanceImage} alt={t("space_public.instance_failure_image_alt")} />
          <h3 className="text-20 font-medium text-on-color">{t("space_public.instance_failure_title")}</h3>
          <p className="text-center text-14 font-medium">
            {t("space_public.instance_failure_description")} <br />
            {t("space_public.instance_failure_hint")}
          </p>
        </div>
        <div className="flex justify-center">
          <Button size="lg" onClick={handleRetry}>
            {t("space_public.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
