import { useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { cn } from "@plane/utils";
import { InitiativeIcon } from "@plane/ui";
// components
import { ListItem } from "@/components/core/list";
// hooks
import { useAppTheme } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { BlockProperties } from "./block-properties";
import { InitiativeQuickActions } from "./quick-actions";

type Props = {
  initiativeId: string;
};

export const InitiativeBlock = observer((props: Props) => {
  const { initiativeId } = props;
  // ref
  const parentRef = useRef(null);
  const { workspaceSlug } = useParams();

  // hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const initiative = getInitiativeById(initiativeId);

  if (!initiative) return <></>;

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
        <>
          <BlockProperties initiative={initiative} isSidebarCollapsed={isSidebarCollapsed} />
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
            />
          </div>
        </>
      }
      isMobile={isMobile}
      parentRef={parentRef}
    />
  );
});
