import { observer } from "mobx-react";
import useSWR from "swr";
import { TUpdate, EUpdateEntityType, EUpdateStatus } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, renderFormattedDate } from "@plane/utils";
import { useMember } from "@/hooks/store";
import Progress from "./progress";
import { StatusOptions, UpdateStatusIcons } from "./status-icons";

type TUpdateList = {
  count: number;
  workspaceSlug: string;
  entityId: string;
  getUpdates: ((params?: { search: EUpdateStatus }) => Promise<TUpdate[]> | undefined) | undefined;
  entityType: EUpdateEntityType;
  status: EUpdateStatus;
  customTitle?: (updateData: TUpdate) => React.ReactNode;
};
export const UpdateList = observer((props: TUpdateList) => {
  const { count, workspaceSlug, entityId, getUpdates, entityType, status, customTitle } = props;
  const { getUserDetails } = useMember();
  const { data: updates, isLoading } = useSWR(
    count > 0 && entityId && workspaceSlug ? `${entityType}_UPDATES_${entityId}_${status}` : null,
    count > 0 ? () => getUpdates?.({ search: status }) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col divide-y divide-custom-border-200">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="flex flex-col gap-3 p-3 ">
            <Loader className="flex items-center gap-2">
              <Loader.Item height="32px" width="32px" className="rounded-full" />
              <div className="flex flex-col gap-1">
                <Loader.Item height="16px" width="100px" />
                <Loader.Item height="16px" width="150px" />
              </div>
            </Loader>
            <Loader className="w-full">
              <Loader.Item height="43px" width="100%" />
            </Loader>
          </div>
        ))}
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

  return (
    updates &&
    updates.length > 0 && (
      <div className="flex flex-col divide-y divide-custom-border-200 max-h-[500px] overflow-y-auto">
        {updates.map((updateData) => (
          <div key={updateData.id} className="relative p-4 pb-0 w-full">
            <div className="flex items-center w-full">
              <div className={cn(`mr-2`, {})}>
                {/* render icon here */}
                <UpdateStatusIcons statusType={updateData.status} size="md" />
              </div>
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

            {/* Progress */}
            <Progress completedIssues={updateData.completed_issues} totalIssues={updateData.total_issues} />
          </div>
        ))}
      </div>
    )
  );
});
