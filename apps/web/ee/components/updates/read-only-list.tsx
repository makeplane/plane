import { Dispatch, SetStateAction } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Tab } from "@headlessui/react";
import { TUpdate, EUpdateEntityType, EUpdateStatus } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { StatusOptions } from "./status-icons";

type TUpdateList = {
  count: number;
  workspaceSlug: string;
  entityId: string;
  handleTabChange: Dispatch<SetStateAction<"project" | "epic">>;
  getUpdates:
    | ((params?: {
        search: EUpdateStatus;
      }) => Promise<{ project_updates: TUpdate[]; epic_updates: TUpdate[] }> | undefined)
    | undefined;
  entityType: EUpdateEntityType;
  status: EUpdateStatus;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
  showTabs?: boolean;
};

type TUpdateListTabs = {
  updates: TUpdate[] | undefined;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
  className?: string;
};

const UpdateListTabs = (props: TUpdateListTabs) => {
  const { updates, customTitle, className } = props;
  const { getUserDetails } = useMember();
  return (
    updates &&
    updates.length > 0 && (
      <div className="flex flex-col divide-y divide-custom-border-200 max-h-[500px] overflow-y-auto">
        {updates.map((updateData) => (
          <div key={updateData.id} className={cn("relative py-4 pb-0 w-full", className)}>
            <div className="flex items-center w-full">
              {/* Type and creator */}
              <div className="flex-1 overflow-hidden">
                {customTitle?.(updateData) || (
                  <div
                    className={cn(`text-[${StatusOptions[updateData.status].color}] font-semibold text-sm capitalize`)}
                  >
                    {updateData.status?.toLowerCase().replaceAll("-", " ")}
                  </div>
                )}
                <div className="text-custom-text-350 font-regular text-xs">
                  {renderFormattedDate(updateData.updated_at)} • {getUserDetails(updateData?.created_by)?.display_name}
                </div>
              </div>
            </div>

            {/* Update */}
            <div className="text-base my-3 break-words w-full whitespace-pre-wrap">{updateData.description}</div>
          </div>
        ))}
      </div>
    )
  );
};

export const UpdateList = observer((props: TUpdateList) => {
  const { count, workspaceSlug, entityId, getUpdates, entityType, status, customTitle, showTabs, handleTabChange } =
    props;
  const { data: updates, isLoading } = useSWR(
    count > 0 && entityId && workspaceSlug ? `INITIATIVE_UPDATES_${entityId}_${status}` : null,
    count > 0 ? () => getUpdates?.({ search: status }) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const projectsCount = updates?.project_updates?.length ?? 0;
  const epicsCount = updates?.epic_updates?.length ?? 0;
  const shouldRenderTabHeader = projectsCount > 0 && epicsCount > 0;
  const defaultTabIndex = shouldRenderTabHeader ? 0 : projectsCount > 0 ? 0 : 1;

  if (isLoading) {
    return (
      <div className="flex flex-col divide-y divide-custom-border-200">
        <Loader className="space-y-4 p-3">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="w-full space-y-3">
              <div className="flex gap-2">
                <div className="w-2/3 space-y-1">
                  <Loader.Item height="20px" />
                  <Loader.Item width="80%" height="10px" />
                </div>
                <div className="w-1/3">
                  <Loader.Item width="100%" height="30px" />
                </div>
              </div>
              <div className="space-y-2">
                <Loader.Item width="100%" height="10px" />
                <Loader.Item width="100%" height="10px" />
                <Loader.Item width="80%" height="10px" />
              </div>
            </div>
          ))}
        </Loader>
      </div>
    );
  }

  if (!isLoading && !updates)
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <div className="text-custom-text-350 font-regular text-xs italic">No updates found</div>
        </div>
      </div>
    );
  if (!showTabs)
    return (
      <>
        <div className="font-semibold text-base capitalize p-4 pb-0 text-custom-text-200">
          {`${entityType === EUpdateEntityType.PROJECT ? "Project" : "Epic"} updates`}
        </div>
        <UpdateListTabs
          updates={entityType === EUpdateEntityType.PROJECT ? updates?.project_updates : updates?.epic_updates}
          customTitle={customTitle}
          className="px-4"
        />
      </>
    );

  return (
    <div className="flex flex-col p-4 overflow-hidden bg-custom-background-100  border border-custom-border-200 rounded-lg">
      <div className="font-semibold text-base capitalize text-custom-text-200 mb-2">
        {shouldRenderTabHeader ? "Updates" : projectsCount > 0 ? "Project updates" : "Epic updates"}
      </div>
      <Tab.Group
        onChange={(index) => {
          handleTabChange(index === 0 ? "project" : "epic");
        }}
        defaultIndex={defaultTabIndex}
      >
        {shouldRenderTabHeader && (
          <Tab.List className="relative border-[0.5px] border-custom-border-200 rounded bg-custom-background-80 p-[1px] flex w-fit">
            <Tab
              className={({ selected }) =>
                cn(
                  "relative z-[1] font-semibold text-xs rounded-[3px] text-custom-text-400 focus:outline-none transition duration-500 px-2 py-1 ",
                  {
                    "text-custom-text-200 bg-custom-background-100": selected,
                    "hover:text-custom-text-300": !selected,
                  }
                )
              }
            >
              <div className="flex items-center gap-2">
                <div className="font-regular text-xs ">Project updates</div>
                <div
                  className={cn("font-regular text-xs px-2 py-0.5 rounded-full bg-transparent", {
                    "text-custom-text-200 bg-custom-background-80": entityType === EUpdateEntityType.PROJECT,
                  })}
                >
                  {projectsCount}
                </div>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                cn(
                  "relative z-[1] font-semibold text-xs rounded-[3px] text-custom-text-400 focus:outline-none transition duration-500 px-2 py-1 ",
                  {
                    "text-custom-text-200 bg-custom-background-100": selected,
                    "hover:text-custom-text-300": !selected,
                  }
                )
              }
            >
              <div className="flex items-center gap-2">
                <div className="font-regular text-xs ">Epic updates</div>
                <div
                  className={cn("font-regular text-xs px-2 py-0.5 rounded-full bg-transparent", {
                    "text-custom-text-200 bg-custom-background-80": entityType === EUpdateEntityType.EPIC,
                  })}
                >
                  {epicsCount}
                </div>
              </div>
            </Tab>
          </Tab.List>
        )}

        <Tab.Panels>
          <Tab.Panel>
            <UpdateListTabs updates={updates?.project_updates} customTitle={customTitle} />
          </Tab.Panel>
          <Tab.Panel>
            <UpdateListTabs updates={updates?.epic_updates} customTitle={customTitle} />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
});
