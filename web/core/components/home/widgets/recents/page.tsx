import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
// plane types
import { TActivityEntityData, TPageEntityData } from "@plane/types";
// plane ui
import { Avatar, Logo } from "@plane/ui";
// plane utils
import { getFileURL } from "@plane/utils";
// components
import { ListItem } from "@/components/core/list";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { getPageName } from "@/helpers/page.helper";
// hooks
import { useMember } from "@/hooks/store";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};

export const RecentPage = (props: BlockProps) => {
  const { activity, ref, workspaceSlug } = props;
  // router
  const router = useRouter();
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const pageDetails = activity.entity_data as TPageEntityData;
  const ownerDetails = getUserDetails(pageDetails?.owned_by);
  const pageLink = pageDetails.project_id
    ? `/${workspaceSlug}/projects/${pageDetails.project_id}/pages/${pageDetails.id}`
    : `/${workspaceSlug}/pages/${pageDetails.id}`;

  return (
    <ListItem
      key={activity.id}
      itemLink=""
      title={""}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center justify-center rounded-md gap-4 ">
          <div className="flex gap-2 items-center justify-center">
            <div className="flex flex-shrink-0 items-center justify-center rounded gap-2 bg-custom-background-80 w-[25.5px] h-[25.5px]">
              <>
                {pageDetails?.logo_props?.in_use ? (
                  <Logo logo={pageDetails?.logo_props} size={16} type="lucide" />
                ) : (
                  <FileText className="h-4 w-4 text-custom-text-350" />
                )}
              </>
            </div>
            {pageDetails?.project_identifier && (
              <div className="font-medium text-custom-sidebar-text-400 text-sm whitespace-nowrap">
                {pageDetails?.project_identifier}
              </div>
            )}
          </div>
          <div className="text-custom-text-200 font-medium text-sm whitespace-nowrap">
            {getPageName(pageDetails?.name)}
          </div>
          <div className="font-medium text-xs text-custom-text-400">{calculateTimeAgo(activity.visited_at)}</div>
        </div>
      }
      quickActionElement={
        <div className="flex gap-4">
          <Avatar src={getFileURL(ownerDetails?.avatar_url ?? "")} name={ownerDetails?.display_name} />
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="bg-transparent my-auto !px-2 border-none py-3"
      itemClassName="my-auto"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(pageLink);
      }}
    />
  );
};
