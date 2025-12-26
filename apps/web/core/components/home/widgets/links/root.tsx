import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";

import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import type { THomeWidgetProps } from "@plane/types";
import { useHome } from "@/hooks/store/use-home";
import { LinkCreateUpdateModal } from "./create-update-link-modal";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";

export const DashboardQuickLinks = observer(function DashboardQuickLinks(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { linkOperations } = useLinks(workspaceSlug);
  const {
    quickLinks: { isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks },
  } = useHome();
  const { t } = useTranslation();

  const handleCreateLinkModal = useCallback(() => {
    toggleLinkModal(true);
    setLinkData(undefined);
  }, [toggleLinkModal, setLinkData]);

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
      />
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="text-14 font-semibold text-tertiary">{t("home.quick_links.title_plural")}</div>
          <button
            onClick={handleCreateLinkModal}
            className="flex gap-1 text-13 font-medium text-accent-primary my-auto"
          >
            <PlusIcon className="size-4 my-auto" /> <span>{t("home.quick_links.add")}</span>
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
