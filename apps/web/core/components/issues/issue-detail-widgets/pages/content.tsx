/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Combobox } from "@headlessui/react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { PageIcon, SearchIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType } from "@plane/types";
import { EModalPosition, EModalWidth, Loader, ModalCore } from "@plane/ui";
import { getPageName } from "@plane/utils";
import { useIssuePages } from "./helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
  pickerOpen: boolean;
  onPickerClose: () => void;
  onCountChange: (count: number) => void;
};

export const IssuePagesCollapsibleContent = observer(function IssuePagesCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, pickerOpen, onPickerClose, onCountChange } = props;
  const { t } = useTranslation();
  const { links, pages, errors, isLoading, refresh, attach, detach } = useIssuePages(
    workspaceSlug,
    projectId,
    issueId
  );
  const [searchTerm, setSearchTerm] = useState("");
  const isAttachingRef = useRef(false);

  useEffect(() => {
    onCountChange(links.length);
  }, [links.length, onCountChange]);
  const linkedPageIds = useMemo(() => new Set(links.map((link) => link.page?.id)), [links]);
  const availablePages = pages.filter(
    (page) =>
      page.id && !linkedPageIds.has(page.id) && getPageName(page.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAttach = async (pageId: string) => {
    if (isAttachingRef.current) return;
    isAttachingRef.current = true;
    try {
      await attach(pageId);
      setSearchTerm("");
      onPickerClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("issue.pages.toasts.link.success.title"),
        message: t("issue.pages.toasts.link.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("issue.pages.toasts.link.error.title"),
        message: t("issue.pages.toasts.link.error.message"),
      });
    } finally {
      isAttachingRef.current = false;
    }
  };

  const handleDetach = async (linkId: string) => {
    try {
      await detach(linkId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("issue.pages.toasts.remove.success.title"),
        message: t("issue.pages.toasts.remove.success.message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("issue.pages.toasts.remove.error.title"),
        message: t("issue.pages.toasts.remove.error.message"),
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 px-2.5 pb-2.5">
        {(errors.linked || errors.available) && (
          <div className="flex items-center justify-between gap-2 px-1 py-2 text-13 text-tertiary">
            <span>{t("common.something_went_wrong_please_try_again")}</span>
            <button type="button" className="text-accent-primary hover:underline" onClick={refresh}>
              {t("common.retry")}
            </button>
          </div>
        )}
        {isLoading && links.length === 0 ? (
          <Loader className="space-y-2">
            <Loader.Item height="40px" />
          </Loader>
        ) : links.length === 0 && !errors.linked ? (
          <p className="px-1 py-2 text-13 text-tertiary">{t("issue.pages.show_wiki_pages")}</p>
        ) : links.length > 0 ? (
          links.map((link) => {
            const pageId = link.page?.id;
            const projectPage = pageId && link.page?.project_ids?.includes(projectId);
            const pageHref = projectPage ? `/${workspaceSlug}/projects/${projectId}/pages/${pageId}` : undefined;
            return (
              <div
                key={link.id}
                className="group flex min-h-10 items-center justify-between gap-2 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <PageIcon className="size-4 flex-shrink-0 text-tertiary" />
                  {pageHref ? (
                    <a href={pageHref} className="truncate text-13 text-primary hover:underline">
                      {getPageName(link.page?.name)}
                    </a>
                  ) : (
                    <span className="truncate text-13 text-primary">{getPageName(link.page?.name)}</span>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-sm p-1 text-placeholder opacity-0 group-hover:opacity-100 hover:bg-layer-1 hover:text-primary"
                    onClick={() => handleDetach(link.id)}
                    aria-label={t("common.remove")}
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : null}
      </div>

      <ModalCore
        isOpen={pickerOpen}
        handleClose={() => {
          setSearchTerm("");
          onPickerClose();
        }}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXL}
      >
        <Combobox value={null} onChange={(pageId: string | null) => pageId && handleAttach(pageId)}>
          <div className="relative m-1">
            <SearchIcon className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-tertiary" />
            <Combobox.Input
              className="h-12 w-full border-0 bg-transparent pr-4 pl-11 text-primary outline-none placeholder:text-placeholder focus:ring-0 sm:text-13"
              placeholder={t("issue.pages.link_pages")}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              displayValue={() => searchTerm}
              autoFocus
            />
          </div>
          <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 overflow-y-auto p-2">
            {availablePages.length === 0 ? (
              <p className="p-3 text-13 text-tertiary">{t("issue.pages.show_wiki_pages")}</p>
            ) : (
              availablePages.map((page) => (
                <Combobox.Option
                  as="div"
                  key={page.id}
                  value={page.id}
                  onClick={() => page.id && handleAttach(page.id)}
                  className={({ active }) =>
                    `flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-13 select-none ${
                      active ? "bg-layer-1 text-primary" : "text-secondary"
                    }`
                  }
                >
                  <PageIcon className="size-4 text-tertiary" />
                  <span className="truncate">{getPageName(page.name)}</span>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Combobox>
      </ModalCore>
    </>
  );
});
