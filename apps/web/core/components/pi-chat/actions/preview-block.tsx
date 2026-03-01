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

import Link from "next/link";
import { ArrowUpRight, Hash, Timer } from "lucide-react";
import { CycleIcon, ModuleIcon, LayersIcon, PageIcon, ProjectIcon, ViewsIcon, EpicIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";
import type { TArtifact } from "@/types";
import { IssueTypeIdentifier } from "@/components/issues/issue-detail/issue-identifier";

export const getIcon = (type: string, color?: string, defaultRender: "text" | "icon" = "icon", className?: string) => {
  switch (type) {
    case "project":
      return <ProjectIcon width={16} height={16} />;
    case "workitem":
      return <LayersIcon width={16} height={16} />;
    case "page":
      return <PageIcon width={16} height={16} />;
    case "cycle":
      return <CycleIcon width={16} height={16} />;
    case "module":
      return <ModuleIcon width={16} height={16} />;
    case "view":
      return <ViewsIcon width={16} height={16} />;
    case "epic":
      return <EpicIcon width={16} height={16} className="text-secondary" />;
    case "comment":
      return <Hash width={16} height={16} />;
    case "worklog":
      return <Timer width={16} height={16} />;
    default:
      return defaultRender === "icon" ? (
        <div className={cn("size-3 rounded", { "bg-layer-1": !color })} style={{ backgroundColor: color }} />
      ) : (
        <div
          className={cn("bg-layer-1 rounded-full py-0.5 px-2 capitalize text-11 text-secondary font-medium", className)}
        >
          {type}
        </div>
      );
  }
};
export function PreviewBlock(props: {
  type: string;
  name?: string;
  url?: string | null;
  data?: TArtifact;
  action?: string;
}) {
  const { type, name, url, data, action } = props;
  const shouldShowAction = ["comment"].includes(type || "");
  const isDisabled = ["worklog", "comment"].includes(type || "");
  return (
    <Link
      target="_blank"
      href={url || ""}
      className="group flex flex-col items-start gap-2 p-3 rounded-xl bg-surface-1 border-[0.5px] border-subtle-1 hover:shadow-sm overflow-hidden text-secondary"
      onClick={(e) => {
        if (isDisabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-center gap-2 justify-between w-full">
        <div className="flex gap-2 items-center">
          <div>
            {(type === "workitem" || type === "epic") && data?.parameters?.properties?.type_id?.id ? (
              <IssueTypeIdentifier issueTypeId={data?.parameters?.properties?.type_id?.id} />
            ) : (
              getIcon(type, "", "text")
            )}
          </div>
          {(type === "workitem" || type === "project" || type === "comment") && data && (
            <div className="text-13 font-medium text-tertiary">
              {data.issue_identifier || data.project_identifier || data.parameters?.project?.identifier}
            </div>
          )}
        </div>
        {!isDisabled && (
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 size-4 bg-layer-1 rounded-full flex items-center justify-center p-0.5">
            <ArrowUpRight className="" strokeWidth={2.5} />
          </div>
        )}
      </div>
      <div className="text-13 font-medium line-clamp-2 text-start">
        <div>{shouldShowAction ? (action === "create" ? "Added " : "Deleted ") + name : name} </div>
      </div>
    </Link>
  );
}
