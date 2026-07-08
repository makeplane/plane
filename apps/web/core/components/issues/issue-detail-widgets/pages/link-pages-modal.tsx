/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Combobox } from "@headlessui/react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon, PlusIcon, SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getPageName } from "@plane/utils";
// hooks
import { EPageStoreType, usePageStore } from "@/hooks/store";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { ProjectPageService } from "@/services/page";
// local imports
import type { TPageOperations } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  isModalOpen: boolean;
  handleOnClose: () => void;
  pageOperations: TPageOperations;
  issueServiceType: TIssueServiceType;
};

const projectPageService = new ProjectPageService();

export const LinkPagesModal = observer(function LinkPagesModal(props: Props) {
  const { workspaceSlug, projectId, issueId, isModalOpen, handleOnClose, pageOperations, issueServiceType } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // store hooks
  const { fetchPagesList, getCurrentProjectPageIds, getPageById } = usePageStore(EPageStoreType.PROJECT);
  const {
    issuePage: { getIssuePageIds },
  } = useIssueDetail(issueServiceType);
  // fetch project pages when the modal is open
  const { isLoading } = useSWR(
    isModalOpen && workspaceSlug && projectId ? `ISSUE_LINK_PAGES_${workspaceSlug}_${projectId}` : null,
    isModalOpen && workspaceSlug && projectId ? () => fetchPagesList(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  // derived values
  const linkedPageIds = getIssuePageIds(issueId) ?? [];
  const projectPageIds = getCurrentProjectPageIds(projectId);
  const availablePageIds = projectPageIds.filter((pageId) => {
    if (linkedPageIds.includes(pageId)) return false;
    const page = getPageById(pageId);
    if (!page || page.archived_at) return false;
    return getPageName(page.name).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleClose = () => {
    handleOnClose();
    setSearchTerm("");
    setSelectedPageIds([]);
    setIsSubmitting(false);
    setIsCreating(false);
  };

  const handleToggleSelection = (pageId: string) => {
    setSelectedPageIds((prev) => (prev.includes(pageId) ? prev.filter((id) => id !== pageId) : [...prev, pageId]));
  };

  const handleSubmit = async () => {
    if (selectedPageIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await pageOperations.attach(selectedPageIds);
      handleClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleCreateAndAttach = async () => {
    if (!workspaceSlug || !projectId) return;
    setIsCreating(true);
    try {
      const page = await projectPageService.create(workspaceSlug, projectId, { name: searchTerm.trim() });
      if (page?.id) await pageOperations.attach([page.id]);
      handleClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("issue.pages.toasts.link.error.title"),
        message: error?.data?.error ?? t("issue.pages.toasts.link.error.message"),
      });
      setIsCreating(false);
    }
  };

  return (
    <ModalCore isOpen={isModalOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <Combobox
        as="div"
        onChange={(pageId: string) => {
          handleToggleSelection(pageId);
        }}
      >
        <div className="relative m-1">
          <SearchIcon
            className="text-opacity-40 pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-primary"
            aria-hidden="true"
          />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent pr-4 pl-11 text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("common.search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {isLoading ? (
            <Loader className="space-y-3 p-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : availablePageIds.length === 0 ? (
            <p className="px-3 py-8 text-center text-13 text-secondary">{t("common.search.no_matching_results")}</p>
          ) : (
            <ul className="p-2 text-13 text-primary">
              {availablePageIds.map((pageId) => {
                const page = getPageById(pageId);
                const selected = selectedPageIds.includes(pageId);
                const logoProps = page?.logo_props;
                return (
                  <Combobox.Option
                    key={pageId}
                    value={pageId}
                    className={({ active }) =>
                      `group my-0.5 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-secondary select-none ${
                        active ? "bg-layer-1 text-primary" : ""
                      } ${selected ? "text-primary" : ""}`
                    }
                  >
                    <input type="checkbox" checked={selected} readOnly />
                    <span className="flex size-4 flex-shrink-0 items-center justify-center">
                      {logoProps?.in_use ? (
                        <Logo logo={logoProps} size={16} type="lucide" />
                      ) : (
                        <PageIcon className="size-4 flex-shrink-0 text-tertiary" />
                      )}
                    </span>
                    <span className="truncate">{getPageName(page?.name)}</span>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-between gap-2 p-3">
        <Button
          variant="link"
          prependIcon={<PlusIcon className="h-4 w-4" />}
          onClick={handleCreateAndAttach}
          loading={isCreating}
        >
          Create new page
        </Button>
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || selectedPageIds.length === 0}
          >
            {isSubmitting ? t("common.adding") : t("common.add")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
