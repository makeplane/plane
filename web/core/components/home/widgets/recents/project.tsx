import { useRouter } from "next/navigation";
import { TActivityEntityData, TProjectEntityData } from "@plane/types";
import { Logo } from "@plane/ui";
import { ListItem } from "@/components/core/list";
import { MemberDropdown } from "@/components/dropdowns";
import { calculateTimeAgo } from "@/helpers/date-time.helper";

type BlockProps = {
  activity: TActivityEntityData;
  ref: React.RefObject<HTMLDivElement>;
  workspaceSlug: string;
};
export const RecentProject = (props: BlockProps) => {
  const { activity, ref, workspaceSlug } = props;
  // router
  const router = useRouter();
  // derived values
  const projectDetails: TProjectEntityData = activity.entity_data as TProjectEntityData;

  return (
    <ListItem
      key={activity.id}
      itemLink=""
      title={""}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center justify-center rounded-md gap-4 ">
          <div className="flex gap-2 items-center justify-center">
            <div className="flex flex-shrink-0 items-center justify-center rounded gap-4 bg-custom-background-80 w-[25.5px] h-[25.5px]">
              <Logo logo={projectDetails?.logo_props} size={16} />
            </div>
            <div className="font-medium text-custom-sidebar-text-400 text-sm whitespace-nowrap">
              {projectDetails?.identifier}
            </div>
          </div>
          <div className="text-custom-text-200 font-medium text-sm whitespace-nowrap">{projectDetails?.name}</div>
          <div className="font-medium text-xs text-custom-text-400">{calculateTimeAgo(activity.visited_at)}</div>
        </div>
      }
      quickActionElement={
        <div className="flex gap-4">
          {projectDetails?.project_members?.length > 0 && (
            <div className="h-5">
              <MemberDropdown
                projectId={projectDetails?.id}
                value={projectDetails?.project_members}
                onChange={() => {}}
                disabled
                multiple
                buttonVariant={
                  projectDetails?.project_members?.length > 0 ? "transparent-without-text" : "border-without-text"
                }
                buttonClassName={projectDetails?.project_members?.length > 0 ? "hover:bg-transparent px-0" : ""}
                showTooltip={projectDetails?.project_members?.length === 0}
                placeholder="Assignees"
                optionsClassName="z-10"
                tooltipContent=""
              />
            </div>
          )}
        </div>
      }
      parentRef={ref}
      disableLink={false}
      className="bg-transparent my-auto !px-2 border-none py-3"
      itemClassName="my-auto"
      onItemClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/${workspaceSlug}/projects/${projectDetails?.id}/issues`);
      }}
    />
  );
};
