import { observer } from "mobx-react";
import { useWorkspace } from "@/hooks/store";
import { AddLink } from "./action";
import { LinkCreateUpdateModal } from "./create-update-link-modal";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";

type TProps = {
  workspaceSlug: string;
};
export const DashboardQuickLinks = observer((props: TProps) => {
  const { workspaceSlug } = props;
  const { linkOperations } = useLinks(workspaceSlug);
  const {
    links: { isLinkModalOpen, toggleLinkModal, linkData, setLinkData },
  } = useWorkspace();

  return (
    <>
      <LinkCreateUpdateModal
        isModalOpen={isLinkModalOpen}
        handleOnClose={() => toggleLinkModal(false)}
        linkOperations={linkOperations}
        preloadedData={linkData}
        setLinkData={setLinkData}
      />
      <div className="flex mx-auto justify-center">
        {/* rendering links */}
        <ProjectLinkList workspaceSlug={workspaceSlug} linkOperations={linkOperations} />

        {/* Add new link */}
        <AddLink onClick={() => toggleLinkModal(true)} />
      </div>
    </>
  );
});
