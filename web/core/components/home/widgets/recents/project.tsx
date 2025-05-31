import { useRouter } from "next/navigation";
// plane types
import { TActivityEntityData, TProjectEntityData } from "@plane/types";
// plane ui
import { Logo } from "@plane/ui";
// components
import { calculateTimeAgo } from "@plane/utils";
import { ListItem } from "@/components/core/list";
import { MemberDropdown } from "@/components/dropdowns";
// helpers

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

  if (!projectDetails) return <></>;

  const projectLink = `/${workspaceSlug}/projects/${projectDetails?.id}/issues`;

  return (
    <ListItem
      key={activity.id}
      itemLink={projectLink}
      title={projectDetails?.name}
      prependTitleElement={
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="flex-shrink-0 grid place-items-center rounded bg-custom-background-80 size-8">
            <Logo logo={projectDetails?.logo_props} size={16} />
          </div>
          <div className="font-medium text-custom-text-400 text-sm whitespace-nowrap">{projectDetails?.identifier}</div>
        </div>
      }
      appendTitleElement={
        <div className="flex-shrink-0 font-medium text-xs text-custom-text-400">
          {calculateTimeAgo(activity.visited_at)}
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
        router.push(projectLink);
      }}
    />
  );
};
