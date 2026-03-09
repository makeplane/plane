/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";

import { useTranslation } from "@plane/i18n";
import { LinkIcon, NewTabIcon, PlusIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { THomeWidgetProps } from "@plane/types";
import { useHome } from "@/hooks/store/use-home";
import useLocalStorage from "@/hooks/use-local-storage";
import { LinkCreateUpdateModal } from "./create-update-link-modal";
import { DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB, QUICK_LINKS_OPEN_IN_SAME_TAB_KEY } from "./constants";
import { ProjectLinkList } from "./links";
import { useLinks } from "./use-links";

export const DashboardQuickLinks = observer(function DashboardQuickLinks(props: THomeWidgetProps) {
  const { workspaceSlug } = props;
  const { linkOperations } = useLinks(workspaceSlug);
  const {
    quickLinks: { isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks },
  } = useHome();
  const { t } = useTranslation();
  const { storedValue: openInSameTab, setValue: setOpenInSameTab } = useLocalStorage(
    QUICK_LINKS_OPEN_IN_SAME_TAB_KEY,
    DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB
  );

  const handleCreateLinkModal = useCallback(() => {
    toggleLinkModal(true);
    setLinkData(undefined);
  }, [toggleLinkModal, setLinkData]);

  const handleToggleOpenInSameTab = useCallback(() => {
    setOpenInSameTab(!(openInSameTab ?? DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB));
  }, [openInSameTab, setOpenInSameTab]);

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
        <div className="mb-4 flex items-center justify-between">
          <div className="text-14 font-semibold text-tertiary">{t("home.quick_links.title_plural")}</div>
          <div className="my-auto flex items-center gap-2">
            <Tooltip
              tooltipContent={
                (openInSameTab ?? DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB)
                  ? t("home.quick_links.open_links_in_same_tab")
                  : t("home.quick_links.open_links_in_new_tab")
              }
            >
              <button
                type="button"
                onClick={handleToggleOpenInSameTab}
                className="rounded p-1 text-tertiary transition-colors hover:bg-surface-2 hover:text-primary"
                aria-label={
                  (openInSameTab ?? DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB)
                    ? t("home.quick_links.open_links_in_same_tab")
                    : t("home.quick_links.open_links_in_new_tab")
                }
              >
                {(openInSameTab ?? DEFAULT_QUICK_LINKS_OPEN_IN_SAME_TAB) ? (
                  <LinkIcon className="size-4" />
                ) : (
                  <NewTabIcon className="size-4" />
                )}
              </button>
            </Tooltip>
            <button onClick={handleCreateLinkModal} className="flex gap-1 text-13 font-medium text-accent-primary">
              <PlusIcon className="my-auto size-4" /> <span>{t("home.quick_links.add")}</span>
            </button>
          </div>
        </div>
        <div className="flex w-full flex-wrap">
          {/* rendering links */}
          <ProjectLinkList workspaceSlug={workspaceSlug} linkOperations={linkOperations} />
        </div>
      </div>
    </>
  );
});
