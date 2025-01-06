import { observer } from "mobx-react";
import useSWR from "swr";
import { useHome } from "@/hooks/store/use-home";
import { LinkCreateUpdateModal } from "./create-update-link-modal";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";
import { THomeWidgetProps } from "@plane/types";

export const DashboardQuickLinks = observer((props: THomeWidgetProps) => {
  const { workspaceSlug } = props;
  const { linkOperations } = useLinks(workspaceSlug);
  const {
    quickLinks: { isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks },
  } = useHome();

  useSWR(
    workspaceSlug ? `HOME_LINKS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchLinks(workspaceSlug.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  return (
    <>
      <LinkCreateUpdateModal
        isModalOpen={isLinkModalOpen}
        handleOnClose={() => toggleLinkModal(false)}
        linkOperations={linkOperations}
        preloadedData={linkData}
        setLinkData={setLinkData}
      />
      <div className="flex mx-auto flex-wrap border-b border-custom-border-100 pb-4 w-full justify-center">
        {/* rendering links */}
        <ProjectLinkList workspaceSlug={workspaceSlug} linkOperations={linkOperations} />
      </div>
    </>
  );
});
