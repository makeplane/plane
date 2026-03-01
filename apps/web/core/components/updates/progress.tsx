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

import { Rocket } from "lucide-react";
import { useTranslation } from "@plane/i18n";

interface IProgressProps {
  completedIssues: number;
  totalIssues: number;
}

function Progress(props: IProgressProps) {
  const { completedIssues, totalIssues } = props;
  const { t } = useTranslation();
  return (
    <div className="flex text-tertiary text-11 gap-3 mb-3 items-center">
      <div className="flex font-medium mr-2 items-center">
        <Rocket size={16} className="my-auto mr-1" />
        <span>
          {t("updates.progress.title")}
          {"  "}
          {totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0}%
        </span>
      </div>
      <div>
        {completedIssues} / {totalIssues} done
      </div>
    </div>
  );
}

export default Progress;
