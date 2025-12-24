import { useRouter } from "next/navigation";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
// plane import
import type { TActivityEntityData, TPageEntityData } from "@plane/types";
import { Avatar } from "@plane/ui";
import { calculateTimeAgo, getFileURL, getPageName } from "@plane/utils";
import { ListItem } from "@/components/core/list";
// hooks
import { useMember } from "@/hooks/store/use-member";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};

export function RecentPage(props: BlockProps) {
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
          <div className="flex-shrink-0 grid place-items-center rounded-sm bg-layer-2 size-8">
            {pageDetails?.logo_props?.in_use ? (
              <Logo logo={pageDetails?.logo_props} size={16} type="lucide" />
            ) : (
              <PageIcon className="size-4 text-tertiary" />
            )}
          </div>
          {pageDetails?.project_identifier && (
            <div className="font-medium text-placeholder text-13 whitespace-nowrap">
              {pageDetails?.project_identifier}
            </div>
          )}
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 font-medium text-11 text-placeholder">
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
      className="my-auto !px-2 border-none py-3"
      itemClassName="my-auto bg-layer-transparent"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(pageLink);
      }}
    />
  );
}
