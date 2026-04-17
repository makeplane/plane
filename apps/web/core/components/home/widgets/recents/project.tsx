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

import { useRouter } from "next/navigation";
// plane types
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TActivityEntityData, TProjectEntityData } from "@plane/types";
import { calculateTimeAgo, truncateProjectIdentifierForDisplay } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
// helpers

type BlockProps = {
  activity: TActivityEntityData;
  parentRef: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};
export function RecentProject(props: BlockProps) {
  const { activity, parentRef, workspaceSlug } = props;
  // router
  const router = useRouter();
  // derived values
  const projectDetails: TProjectEntityData = activity.entity_data as TProjectEntityData;

  if (!projectDetails) return <></>;

  const projectLink = `/${workspaceSlug}/projects/${projectDetails?.id}/issues`;

  return (
    <ListItem
      key={activity.id}
      itemLink={projectLink}
      title={projectDetails?.name}
      prependTitleElement={
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="flex-shrink-0 grid place-items-center rounded-sm bg-layer-2 size-8">
            <Logo logo={projectDetails?.logo_props} size={16} />
          </div>
          <div className="font-medium text-placeholder text-13 whitespace-nowrap">
            {truncateProjectIdentifierForDisplay(projectDetails?.identifier || "")}
          </div>
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 font-medium text-11 text-placeholder">
          {calculateTimeAgo(activity.visited_at)}
        </div>
      }
      quickActionElement={
        <div className="flex gap-4">
          {projectDetails?.project_members?.length > 0 && (
            <div className="h-5">
              <MemberDropdown
                projectId={projectDetails?.id}
                value={projectDetails?.project_members}
                onChange={() => {}}
                disabled
                multiple
                buttonVariant={
                  projectDetails?.project_members?.length > 0 ? "transparent-without-text" : "border-without-text"
                }
                buttonClassName={projectDetails?.project_members?.length > 0 ? "hover:bg-transparent px-0" : ""}
                showTooltip={projectDetails?.project_members?.length === 0}
                placeholder="Assignees"
                optionsClassName="z-10"
                tooltipContent=""
              />
            </div>
          )}
        </div>
      }
      parentRef={parentRef}
      disableLink={false}
      className="my-auto !px-2 border-none py-3"
      itemClassName="my-auto"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(projectLink);
      }}
    />
  );
}
