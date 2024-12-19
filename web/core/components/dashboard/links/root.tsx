import { AddLink } from "./action";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";

type TProps = {
  workspaceSlug: string;
};
export const DashboardQuickLinks = (props: TProps) => {
  const { workspaceSlug } = props;
  const { linkOperations } = useLinks(workspaceSlug);
  return (
    <>
      <div className="flex mx-auto justify-center">
        {/* rendering links */}
        <ProjectLinkList workspaceSlug={workspaceSlug} linkOperations={linkOperations} />

        {/* Add new link */}
        <AddLink />
      </div>
    </>
  );
};
