/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import { AuthHeader } from "@/app/(all)/(home)/auth-header";
import InstanceFailureDarkImage from "@/app/assets/instance/instance-failure-dark.svg?url";
import InstanceFailureImage from "@/app/assets/instance/instance-failure.svg?url";

export const InstanceFailureView = observer(function InstanceFailureView() {
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  const instanceImage = resolvedTheme === "dark" ? InstanceFailureDarkImage : InstanceFailureImage;

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <>
      <AuthHeader />
      <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
        <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
          <div className="relative flex flex-col justify-center items-center space-y-4">
            <img src={instanceImage} alt="Instance failure illustration" />
            <h3 className="font-medium text-20 text-on-color text-center">{t("admin.instance_failure_title")}</h3>
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
    </>
  );
});
