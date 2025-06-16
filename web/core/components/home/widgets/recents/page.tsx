import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
// plane types
import { TActivityEntityData, TPageEntityData } from "@plane/types";
// plane ui
import { Avatar, Logo } from "@plane/ui";
import { calculateTimeAgo, getFileURL, getPageName } from "@plane/utils";
// plane utils
// components
import { ListItem } from "@/components/core/list";
// helpers
//
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

  if (!pageDetails) return <></>;

  const ownerDetails = getUserDetails(pageDetails?.owned_by);
  const pageLink = pageDetails.project_id
    ? `/${workspaceSlug}/projects/${pageDetails.project_id}/pages/${pageDetails.id}`
    : `/${workspaceSlug}/pages/${pageDetails.id}`;

  return (
    <ListItem
      key={activity.id}
      itemLink={pageLink}
      title={getPageName(pageDetails?.name)}
      prependTitleElement={
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="flex-shrink-0 grid place-items-center rounded bg-custom-background-80 size-8">
            {pageDetails?.logo_props?.in_use ? (
              <Logo logo={pageDetails?.logo_props} size={16} type="lucide" />
            ) : (
              <FileText className="size-4 text-custom-text-350" />
            )}
          </div>
          {pageDetails?.project_identifier && (
            <div className="font-medium text-custom-text-400 text-sm whitespace-nowrap">
              {pageDetails?.project_identifier}
            </div>
          )}
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 font-medium text-xs text-custom-text-400">
          {calculateTimeAgo(activity.visited_at)}
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
