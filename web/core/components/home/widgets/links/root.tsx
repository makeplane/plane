import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { THomeWidgetProps } from "@plane/types";
import { useHome } from "@/hooks/store/use-home";
import { LinkCreateUpdateModal } from "./create-update-link-modal";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";

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
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-base font-semibold text-custom-text-350">Quick links</div>
          <button
            onClick={() => {
              toggleLinkModal(true);
            }}
            className="flex gap-1 text-sm font-medium text-custom-primary-100 my-auto"
          >
            <Plus className="size-4 my-auto" /> <span>Add quick link</span>
          </button>
        </div>
        <div className="flex flex-wrap w-full">
          {/* rendering links */}
          <ProjectLinkList workspaceSlug={workspaceSlug} linkOperations={linkOperations} />
        </div>
      </div>
    </>
  );
});
