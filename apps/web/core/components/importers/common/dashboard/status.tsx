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

import type { FC } from "react";
import { observer } from "mobx-react";
import type { TJobStatus } from "@plane/etl/core";
import { E_JOB_STATUS } from "@plane/etl/core";
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type TSyncJobStatusProps = {
  status: TJobStatus;
};

const STATUS_CLASSNAMES: { [key in TJobStatus]: string } = {
  [E_JOB_STATUS.CREATED]: "text-gray-500 border border-gray-500 bg-gray-500/10",
  [E_JOB_STATUS.QUEUED]: "text-gray-500 border border-gray-500 bg-gray-500/10",
  [E_JOB_STATUS.INITIATED]: "text-gray-500 border border-gray-500 bg-gray-500/10",
  [E_JOB_STATUS.PULLING]: "text-yellow-500 border border-yellow-500 bg-yellow-500/10",
  [E_JOB_STATUS.PULLED]: "text-yellow-500 border border-yellow-500 bg-yellow-500/10",
  [E_JOB_STATUS.PROGRESSING]: "text-yellow-500 border border-yellow-500 bg-yellow-500/10",
  [E_JOB_STATUS.TRANSFORMING]: "text-orange-500 border border-orange-500 bg-orange-500/10",
  [E_JOB_STATUS.TRANSFORMED]: "text-orange-500 border border-orange-500 bg-orange-500/10",
  [E_JOB_STATUS.PUSHING]: "text-success-primary border border-success-strong bg-success-subtle",
  [E_JOB_STATUS.FINISHED]: "text-success-primary border border-success-strong bg-success-subtle",
  [E_JOB_STATUS.ERROR]: "text-danger-primary border border-danger-strong bg-danger-subtle",
  [E_JOB_STATUS.CANCELLED]: "text-danger-primary border border-danger-strong bg-danger-subtle",
};

export const SyncJobStatus = observer(function SyncJobStatus(props: TSyncJobStatusProps) {
  const { status } = props;
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "inline-flex text-11 px-2 py-[1px] rounded-full overflow-hidden whitespace-nowrap font-medium",
        STATUS_CLASSNAMES[status]
      )}
    >
      {t(`import_status.${status.toLowerCase()}`)}
    </div>
  );
});
