import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { ControlLink, InitiativeIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { UpdateStatusPills } from "@/plane-web/components/initiatives/common/update-status";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { useInitiativeUpdates } from "../details/sidebar/use-updates";
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
  const { handleUpdateOperations } = useInitiativeUpdates(workspaceSlug.toString(), initiativeId);

  const initiative = getInitiativeById(initiativeId);
  const initiativeStats = getInitiativeStatsById(initiativeId);

  if (!initiative) return <></>;

  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <ListItem
      title={initiative.name}
      itemLink={`/${workspaceSlug}/initiatives/${initiative.id}`}
      prependTitleElement={
        <div className="flex flex-shrink-0 size-8 items-center justify-center rounded-md bg-custom-background-90">
          <InitiativeIcon className="size-4 text-custom-text-300" />
        </div>
      }
      quickActionElement={
        <div className="flex shrink-0 items-center gap-2">
          <UpdateStatusPills
            handleUpdateOperations={handleUpdateOperations}
            workspaceSlug={workspaceSlug.toString()}
            initiativeId={initiativeId}
            analytics={initiativeStats}
          />
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
      itemClassName={"!overflow-visible flex-wrap md:flex-nowrap"}
    />
  );
});
