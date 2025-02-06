import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { CircularProgressIndicator, ControlLink, InitiativeIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
// hooks
import { getProgress } from "@/helpers/common.helper";
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativeQuickActions } from "./quick-actions";
import { ReadOnlyBlockProperties } from "./read-only-properties";

type Props = {
  initiativeId: string;
};

export const InitiativeBlock = observer((props: Props) => {
  const { initiativeId } = props;
  // ref
  const parentRef = useRef(null);
  const { workspaceSlug } = useParams();

  // hooks
  const router = useAppRouter();
  const {
    initiative: { getInitiativeById, getInitiativeStatsById },
  } = useInitiatives();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();

  const initiative = getInitiativeById(initiativeId);
  const initiativeStats = getInitiativeStatsById(initiativeId);

  if (!initiative) return <></>;

  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const progress = getProgress(initiativeStats?.completed_issues ?? 0, initiativeStats?.total_issues);

  return (
    <ListItem
      title={initiative.name}
      itemLink={`/${workspaceSlug}/initiatives/${initiative.id}`}
      prependTitleElement={
        <div className="flex flex-shrink-0 size-8 items-center justify-center rounded-md bg-custom-background-90">
          <InitiativeIcon className="size-4 text-custom-text-300" />
        </div>
      }
      appendTitleElement={
        <>
          <div className="flex items-center gap-1">
            <CircularProgressIndicator size={20} percentage={progress} strokeWidth={3} />
            <span className="text-sm font-medium text-custom-text-300 px-1">{`${progress}%`}</span>
          </div>
        </>
      }
      quickActionElement={
        <div className="flex shrink-0 items-center gap-2">
          <ControlLink
            className="relative flex w-full items-center gap-3 overflow-hidden"
            href={`/${workspaceSlug}/initiatives/${initiative.id}`}
            target="_self"
            onClick={() => {
              router.push(`/${workspaceSlug}/initiatives/${initiative.id}`);
            }}
          >
            <ReadOnlyBlockProperties initiative={initiative} isSidebarCollapsed={isSidebarCollapsed} />
          </ControlLink>
          <div
            className={cn("hidden", {
              "md:flex": isSidebarCollapsed,
              "lg:flex": !isSidebarCollapsed,
            })}
          >
            <InitiativeQuickActions
              parentRef={parentRef}
              initiative={initiative}
              workspaceSlug={workspaceSlug.toString()}
              disabled={!isEditable}
            />
          </div>
        </div>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
