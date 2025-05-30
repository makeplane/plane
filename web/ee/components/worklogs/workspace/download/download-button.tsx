"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { PopoverMenu } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { useWorkspaceWorklogDownloads, useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import { TWorklogDownload } from "@/plane-web/types";

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

export const WorkspaceWorklogDownloadButton: FC<TWorkspaceWorklogDownloadButton> = observer((props) => {
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
    } catch (error) {
      setButtonLoader(false);
    }
  };

  return (
    <button
      className={cn(
        "relative flex items-center rounded transition-all bg-custom-primary-100 hover:bg-custom-primary-200 focus:text-custom-brand-40 focus:bg-custom-primary-200 font-semibold text-white",
        {
          "cursor-not-allowed !bg-custom-primary-60 hover:bg-custom-primary-60": buttonLoader,
        }
      )}
      disabled={buttonLoader}
    >
      <div
        className="flex w-full h-full px-2 py-0.5 text-sm font-medium border-r border-white"
        onClick={() => downloadWorklogs("csv")}
      >
        {buttonLoader ? "Downloading..." : "Download"}
      </div>
      <PopoverMenu
        buttonClassName="outline-none focus:outline-none flex"
        button={
          <div className="flex-shrink-0 px-2 py-0.5 overflow-hidden flex justify-center items-center my-auto">
            <ChevronDown size={16} className="my-auto" />
          </div>
        }
        data={downloadFormatOptions}
        keyExtractor={(option: TDownloadFormatOptions) => option.value}
        panelClassName="space-y-0.5 w-32 flex flex-col"
        render={(option: TDownloadFormatOptions) => (
          <button
            className="px-1.5 py-1 text-left rounded text-xs font-medium cursor-pointer hover:bg-custom-background-80 text-custom-text-200 hover:text-custom-text-100 transition-all"
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
