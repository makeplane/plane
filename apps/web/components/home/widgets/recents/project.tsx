/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRouter } from "next/navigation";
// plane types
import { Logo } from "@plane/blocks/emoji-icon-picker";
import type { TActivityEntityData, TProjectEntityData } from "@plane/types";
import { calculateTimeAgo } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// helpers

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement | null>;
  workspaceSlug: string;
};
export function RecentProject(props: BlockProps) {
  const { activity, ref, workspaceSlug } = props;
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
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="grid size-4 flex-shrink-0 place-items-center">
            <Logo logo={projectDetails?.logo_props} size={16} />
          </div>
          <div className="text-caption-md-regular whitespace-nowrap text-tertiary">{projectDetails?.identifier}</div>
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 text-caption-md-regular text-tertiary">
          {calculateTimeAgo(activity.visited_at)}
        </div>
      }
      quickActionElement={
        <div className="flex items-center gap-2">
          {projectDetails?.project_members?.length > 0 && (
            <ButtonAvatars showTooltip={false} userIds={projectDetails.project_members} size="xs" max={3} />
          )}
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="!min-h-[38px] !flex-row !gap-0 rounded-md border-none !px-2 !py-2"
      itemClassName="!gap-2"
      linkClassName="!gap-2"
      titleClassName="text-body-sm-medium"
      leftElementClassName="!gap-2"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(projectLink);
      }}
    />
  );
}
