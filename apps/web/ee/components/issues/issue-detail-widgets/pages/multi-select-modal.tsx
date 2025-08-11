// PagesMultiSelectModal rewritten to follow ExistingIssuesListModal pattern
"use client";

import React, { useCallback, useEffect, useState } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react";
import { Earth, FileText, Lock, Search, X } from "lucide-react";
import { Combobox } from "@headlessui/react";
// hooks
import { useTranslation } from "@plane/i18n";
import { EPageAccess, TIssuePage, TIssueServiceType } from "@plane/types";
import {
  setToast,
  TOAST_TYPE,
  ToggleSwitch,
  Button,
  Logo,
  ModalCore,
  EModalWidth,
  EModalPosition,
  Loader,
  Checkbox,
} from "@plane/ui";
// types
// components
import { getPageName, getTabIndex } from "@plane/utils";
import { IssueIdentifier } from "@/ce/components/issues/issue-details/issue-identifier";

import { useIssueDetail } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { WorkspacePageService } from "@/plane-web/services/page";

const service = new WorkspacePageService();

const PagesMultiSelectModal = observer(
  (props: {
    isOpen: boolean;
    selectedPages: TIssuePage[];
    workItemId: string;
    projectId: string | null | undefined;
    workspaceSlug: string;
    issueServiceType: TIssueServiceType;
    onClose: () => void;
  }) => {
    const { isOpen, onClose, workItemId, projectId, workspaceSlug, issueServiceType } = props;
    // plane hooks
    const { t } = useTranslation();
    const {
      pages: { updateIssuePages, getPageById, getPagesByIssueId },
    } = useIssueDetail(issueServiceType);
    const { isMobile } = usePlatformOS();
    const { baseTabIndex } = getTabIndex(undefined, isMobile);
    // state
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredPages, setFilteredPages] = useState<TIssuePage[]>([]);
    const [selectedPages, setSelectedPages] = useState<TIssuePage[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showWikiPages, setShowWikiPages] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const issuePages = getPagesByIssueId(workItemId)
      .map((id) => getPageById(id))
      .filter((page) => page !== undefined);

    const handleClose = () => {
      onClose();
      setSearchTerm("");
      setFilteredPages([]);
      setShowWikiPages(false);
    };

    const onSubmit = async () => {
      setIsSubmitting(true);
      await updateIssuePages(
        workspaceSlug,
        projectId ?? "",
        workItemId,
        selectedPages.map((p) => p.id)
      )
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("issue.pages.toasts.link.success.title"),
            message: t("issue.pages.toasts.link.success.message"),
          });
          handleClose();
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("issue.pages.toasts.link.error.title"),
            message: t("issue.pages.toasts.link.error.message"),
          });
        })
        .finally(() => setIsSubmitting(false));
    };

    const handleSearch = async (currentSearchTerm: string) => {
      if (!isOpen || !workspaceSlug) return;

      setIsLoading(true);
      try {
        const pages = await service.searchPages(workspaceSlug, projectId ?? "", {
          is_global: showWikiPages,
          search: currentSearchTerm,
        });
        setFilteredPages(pages);
      } catch (error) {
        console.error("Error searching pages", error);
      } finally {
        setIsLoading(false);
      }
    };
    // Debounce the search function
    const debouncedSearch = useCallback(
      debounce((currentSearchTerm: string) => {
        handleSearch(currentSearchTerm);
      }, 500), // 500ms debounce delay
      [isOpen, workspaceSlug, projectId, showWikiPages] // Dependencies for useCallback
    );

    useEffect(() => {
      debouncedSearch(searchTerm);
      return () => debouncedSearch.cancel();
    }, [searchTerm, isOpen, showWikiPages, debouncedSearch]);

    useEffect(() => {
      if (isOpen) setIsLoading(true);
      setSelectedPages(issuePages);
    }, [isOpen]);

    return (
      <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
        <Combobox
          as="div"
          onChange={(val: TIssuePage) => {
            if (selectedPages.some((p) => p.id === val.id)) {
              setSelectedPages((prev) => prev.filter((p) => p.id !== val.id));
            } else {
              setSelectedPages((prev) => [...prev, val]);
            }
          }}
        >
          <div className="flex flex-col gap-3 p-4 pb-0 ">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-custom-text-200">Link pages to</h3>
              <IssueIdentifier
                issueId={workItemId}
                projectId={projectId ?? ""}
                size="md"
                enableClickToCopyIdentifier
                textContainerClassName="text-lg font-semibold text-custom-text-200"
              />
            </div>
            <div className="flex items-center gap-2 rounded border border-custom-border-200 px-2 py-1.5">
              <Search className="flex-shrink-0 size-4 text-custom-text-200" aria-hidden="true" />
              <Combobox.Input
                className="w-full border-0 bg-transparent text-base text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
                placeholder="Search for pages"
                displayValue={() => ""}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                tabIndex={baseTabIndex}
              />
            </div>
            <div className="w-full flex items-center gap-2 text-sm text-custom-text-200 justify-end">
              <span className="text-sm font-medium text-custom-text-200">{t("issue.pages.show_wiki_pages")}</span>
              <ToggleSwitch value={showWikiPages} onChange={() => setShowWikiPages(!showWikiPages)} />
            </div>
          </div>

          {selectedPages.length > 0 && (
            <div className="flex flex-wrap gap-2 py-2 px-4 w-full">
              {selectedPages.map((page) => (
                <div
                  key={page.id}
                  className="group flex items-center gap-1.5 bg-custom-background-90 px-2 py-1 rounded cursor-pointer w-fit overflow-hidden"
                  onClick={() => setSelectedPages((prev) => prev.filter((p) => p.id !== page.id))}
                >
                  {page?.logo_props && page.logo_props?.in_use ? (
                    <Logo logo={page.logo_props} size={16} type="lucide" />
                  ) : (
                    <FileText className="size-4 text-custom-text-300" />
                  )}
                  <p className="text-xs truncate text-custom-text-300 group-hover:text-custom-text-200 transition-colors">
                    {getPageName(page?.name ?? "")}
                  </p>
                  <X className="size-3 flex-shrink-0 text-custom-text-400 group-hover:text-custom-text-200 transition-colors" />
                </div>
              ))}
            </div>
          )}

          <Combobox.Options
            static
            className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto p-2 min-h-[320px]"
          >
            {isLoading && filteredPages.length === 0 ? (
              <div className="flex items-center justify-center h-full w-full">
                <Loader className="space-y-3 p-3 w-full">
                  <Loader.Item height="40px" width="100%" />
                  <Loader.Item height="40px" width="100%" />
                </Loader>
              </div>
            ) : filteredPages.length > 0 ? (
              filteredPages.map((page) => {
                const selected = selectedPages.some((p) => p.id === page.id);
                return (
                  <Combobox.Option
                    key={page.id}
                    as="label"
                    htmlFor={`page-${page.id}`}
                    value={page}
                    className={({ active }) =>
                      `group flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-custom-text-200 ${
                        active ? "bg-custom-background-80 text-custom-text-100" : ""
                      } ${selected ? "text-custom-text-100" : ""}`
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Checkbox checked={selected} readOnly />
                      <div className="flex-shrink-0">
                        {page.logo_props && page.logo_props?.in_use ? (
                          <Logo logo={page.logo_props} size={16} type="lucide" />
                        ) : (
                          <FileText className="size-4 text-custom-text-300" />
                        )}
                      </div>
                      <span className="truncate text-base">{getPageName(page.name)}</span>
                    </div>
                    {page.access != null && (
                      <div className="hidden flex-shrink-0 text-custom-text-350 group-hover:flex">
                        {page.access === EPageAccess.PUBLIC ? (
                          <Earth className="size-4" />
                        ) : (
                          <Lock className="size-4" />
                        )}
                      </div>
                    )}
                  </Combobox.Option>
                );
              })
            ) : (
              <div className="flex items-center h-full w-full px-3 ">
                <p className="text-sm text-custom-text-200">No pages found</p>
              </div>
            )}
          </Combobox.Options>
        </Combobox>

        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={onSubmit} loading={isSubmitting}>
            {isSubmitting ? t("common.confirming") : t("common.confirm")}
          </Button>
        </div>
      </ModalCore>
    );
  }
);

export { PagesMultiSelectModal };
