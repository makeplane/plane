"use client";

import { FC } from "react";
// helpers
import { cn  } from "@plane/utils";
// plane web types
import { TWorklogDownloadStatus } from "@/plane-web/types";

export const WorklogDownloadStatus: FC<{ status: TWorklogDownloadStatus | undefined; loader: boolean }> = (props) => {
  const { status, loader } = props;
  // hooks

  if (!status) return <></>;
  return (
    <span
      className={cn(`rounded px-2 py-0.5 text-xs capitalize`, {
        "bg-green-500/20 text-green-500": status === "completed",
        "bg-yellow-500/20 text-yellow-500": ["processing", "queued"].includes(status),
        "bg-red-500/20 text-red-500": status === "failed",
        "bg-gray-500/20 text-gray-500": loader,
      })}
    >
      {loader ? "Refreshing..." : status}
    </span>
  );
};
