import React, { useState } from "react";
import Link from "next/link";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
// plane imports
import { EpicIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { EUpdateEntityType, EUpdateStatus, TUpdate } from "@plane/types";
import { capitalizeFirstLetter, cn } from "@plane/utils";
// plane web components
import { UpdateStatusIcons } from "@/plane-web/components/updates/status-icons";
// local components
import { UpdateList } from "../../updates/read-only-list";

type TStatusPills = {
  showTabs?: boolean;
  defaultTab?: "project" | "epic";
  handleUpdateOperations: {
    fetchUpdates: (params?: { search: EUpdateStatus }) => Promise<{
      project_updates: TUpdate[];
      epic_updates: TUpdate[];
    }>;
    fetchProjectUpdates: (params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
    fetchEpicUpdates: (params?: { search: EUpdateStatus }) => Promise<TUpdate[]>;
  };
  workspaceSlug: string;
  initiativeId: string;
  analytics:
    | {
        on_track_updates: number;
        at_risk_updates: number;
        off_track_updates: number;
      }
    | undefined;
};
interface IInitiativeUpdate extends TUpdate {
  epic_id: string;
  epic__sequence_id: string;
  epic__name: string;
  project__identifier: string;
  project__name: string;
  project_id: string;
}

export const UpdateStatusPills = (props: TStatusPills) => {
  const { handleUpdateOperations, workspaceSlug, initiativeId, analytics, defaultTab = "project", showTabs } = props;
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [selectedTab, setSelectedTab] = useState<"project" | "epic">(defaultTab);

  const statusCounts = {
    [EUpdateStatus.ON_TRACK]: analytics?.on_track_updates ?? 0,
    [EUpdateStatus.AT_RISK]: analytics?.at_risk_updates ?? 0,
    [EUpdateStatus.OFF_TRACK]: analytics?.off_track_updates ?? 0,
  };
  // react-popper derived values
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 10,
        },
      },
    ],
  });

  return (
    <div className="flex gap-2 flex-shrink-0">
      {Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => (
          <Popover className={cn("relative flex h-full items-center justify-center")} key={status}>
            <Popover.Button
              ref={setReferenceElement}
              className={cn("my-auto outline-none text-custom-text-300")}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip tooltipContent={status && capitalizeFirstLetter(status.replaceAll("-", " ").toLowerCase())}>
                <button className="flex items-center gap-1 border border-custom-border-300 rounded-full px-2 py-1 bg-custom-background-100 hover:shadow-sm">
                  <UpdateStatusIcons statusType={status as EUpdateStatus} showBackground={false} />
                  <span className="text-xs font-medium text-custom-text-300">{count}</span>
                </button>
              </Tooltip>
            </Popover.Button>

            <Popover.Panel
              className={cn(
                "absolute left-0 top-full z-20 w-screen mt-2 rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 text-xs shadow-custom-shadow-rg focus:outline-none max-w-[320px]"
              )}
              ref={setPopperElement}
              style={styles.popper}
              {...attributes.popper}
            >
              <UpdateList
                handleTabChange={setSelectedTab}
                count={count}
                workspaceSlug={workspaceSlug}
                entityId={initiativeId}
                showTabs={showTabs}
                getUpdates={handleUpdateOperations.fetchUpdates}
                entityType={selectedTab === "project" ? EUpdateEntityType.PROJECT : EUpdateEntityType.EPIC}
                status={status as EUpdateStatus}
                customTitle={(updateData) => {
                  const initiativeUpdate = updateData as IInitiativeUpdate;
                  const route = initiativeUpdate.epic_id
                    ? `/${workspaceSlug}/projects/${initiativeUpdate.project_id}/epics/${initiativeUpdate.epic_id}`
                    : `/${workspaceSlug}/projects/${initiativeUpdate.project_id}/issues`;
                  return (
                    <Link href={route} className={cn(`font-medium capitalize flex gap-2`)} target="_blank">
                      {initiativeUpdate.epic_id && (
                        <div className="flex gap-2 text-custom-text-350 items-center">
                          <EpicIcon className="size-4 my-auto flex-shrink-0" />
                          <div className="text-[11px] flex flex-shrink-0 gap-1">
                            <span>{initiativeUpdate.project__identifier}</span>
                            <span>{initiativeUpdate.epic__sequence_id}</span>
                          </div>
                        </div>
                      )}
                      <span className="truncate font-semibold min-w-[0] text-sm text-custom-text-300 my-auto flex-1">
                        {initiativeUpdate.epic__name || initiativeUpdate.project__name}
                      </span>
                      <UpdateStatusIcons
                        statusType={initiativeUpdate.status}
                        size="sm"
                        showText
                        className="justify-end"
                      />
                    </Link>
                  );
                }}
              />
            </Popover.Panel>
          </Popover>
        ))}
    </div>
  );
};
