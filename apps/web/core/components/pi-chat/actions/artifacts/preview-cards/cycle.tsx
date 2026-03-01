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

import { observer } from "mobx-react";
import { CycleIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import { DisplayDates } from "@/components/properties/dates";
import { useCycleData } from "../useArtifactData";
import { WithPreviewHOC } from "./with-preview-hoc";

type TProps = {
  artifactId: string;
};

export const CyclePreviewCard = observer(function CyclePreviewCard(props: TProps) {
  const { artifactId } = props;
  const data = useCycleData(artifactId);
  if (!data) return <></>;
  return (
    <WithPreviewHOC artifactId={artifactId}>
      <div className="flex gap-2 items-start">
        <CycleIcon className="size-4 text-primary my-0.5" />
        <div className="flex flex-col gap-2">
          <div className="truncate text-body-sm-medium text-start capitalize">{data?.name || "Unknown"}</div>
          {/* properties */}
          {(data.start_date || data.end_date) && (
            <div
              className={cn(
                "flex flex-wrap gap-2 items-center [&>*]:p-0 [&>*]:hover:bg-transparent text-body-sm-regular text-tertiary"
              )}
            >
              <DisplayDates startDate={data.start_date ?? null} endDate={data.end_date ?? null} />
            </div>
          )}
        </div>
      </div>
    </WithPreviewHOC>
  );
});
