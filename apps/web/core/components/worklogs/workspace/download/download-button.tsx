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

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon } from "@plane/propel/icons";
import { PopoverMenu } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { useWorkspaceWorklogDownloads, useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import type { TWorklogDownload } from "@/types";

type TDownloadFormat = "csv" | "xlsx";

type TDownloadFormatOptions = {
  value: TDownloadFormat;
  label: string;
};

const downloadFormatOptions: TDownloadFormatOptions[] = [
  {
    value: "xlsx",
    label: "Excel",
  },
  {
    value: "csv",
    label: "CSV",
  },
];

type TWorkspaceWorklogDownloadButton = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogDownloadButton = observer(function WorkspaceWorklogDownloadButton(
  props: TWorkspaceWorklogDownloadButton
) {
  const { workspaceSlug } = props;
  // hooks
  const { filters } = useWorkspaceWorklogs();
  const { createWorklogDownload } = useWorkspaceWorklogDownloads();
  // states
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  const downloadWorklogs = async (format: TDownloadFormat) => {
    try {
      setButtonLoader(true);
      const payload: Partial<TWorklogDownload> = { provider: format, filters: filters };
      await createWorklogDownload(workspaceSlug, payload);
      setButtonLoader(false);
    } catch (_error) {
      setButtonLoader(false);
    }
  };

  return (
    <button
      className={cn(
        "relative flex items-center rounded-sm transition-all bg-accent-primary hover:bg-accent-primary/80 focus:bg-accent-primary/80 font-semibold",
        {
          "cursor-not-allowed hover:bg-accent-subtle!": buttonLoader,
        }
      )}
      disabled={buttonLoader}
    >
      <div
        className="flex w-full h-full px-2 py-0.5 text-13 font-medium border-r border-white text-on-color"
        onClick={() => downloadWorklogs("csv")}
      >
        {buttonLoader ? "Downloading" : "Download"}
      </div>
      <PopoverMenu
        buttonClassName="outline-none focus:outline-none flex"
        button={
          <div className="flex-shrink-0 px-2 py-0.5 overflow-hidden flex justify-center items-center my-auto text-on-color">
            <ChevronDownIcon height={16} width={16} className="my-auto" />
          </div>
        }
        data={downloadFormatOptions}
        keyExtractor={(option: TDownloadFormatOptions) => option.value}
        panelClassName="space-y-0.5 w-32 flex flex-col"
        render={(option: TDownloadFormatOptions) => (
          <button
            className="px-1.5 py-1 text-left rounded-sm text-11 font-medium cursor-pointer hover:bg-layer-transparent-hover transition-all"
            onClick={() => downloadWorklogs(option.value)}
            disabled={buttonLoader}
          >
            {option.label}
          </button>
        )}
      />
    </button>
  );
});
