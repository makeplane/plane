/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { Link } from "react-router";
import { FilePlus, X } from "lucide-react";
// plane imports
import { EPageAccess } from "@plane/constants";
import { ChevronDownIcon, PageIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TPage } from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// services
import { ProjectPageService } from "@/services/page";
// local imports
import { CreateIssuePageModal } from "./create-page-modal";

const projectPageService = new ProjectPageService();

// action options rendered above the page list
const CREATE_PAGE = "__create_page__";
const REMOVE_PAGE = "__remove_page__";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  className?: string;
};

export const IssuePageSelect = observer(function IssuePageSelect(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled = false, className } = props;
  // states
  const [projectPages, setProjectPages] = useState<TPage[] | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // refs
  const isFetchingPages = useRef(false);
  // store hooks
  const {
    issue: { getIssueById },
    page: { getPageByIssueId, linkPage, removePage },
    toggleLinkPagesModal,
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);
  const issuePage = getPageByIssueId(issueId);
  const linkedPageProjectId = issuePage?.page_detail?.project_ids?.[0] ?? projectId;
  const linkedPageUrl = issuePage
    ? `/${workspaceSlug}/projects/${linkedPageProjectId}/pages/${issuePage.page}`
    : undefined;

  const fetchProjectPages = () => {
    if (projectPages !== undefined || isFetchingPages.current) return;
    isFetchingPages.current = true;
    projectPageService
      .fetchAll(workspaceSlug, projectId)
      .then((pages) => setProjectPages(pages.filter((page) => !page.archived_at)))
      .catch(() => setProjectPages([]))
      .finally(() => {
        isFetchingPages.current = false;
      });
  };

  // the modal state is mirrored in the store so the peek overview doesn't treat clicks inside it as outside clicks
  const handleCreateModalToggle = (value: boolean) => {
    setIsCreateModalOpen(value);
    toggleLinkPagesModal(value);
  };

  const handleLinkPage = async (pageId: string) => {
    try {
      await linkPage(workspaceSlug, projectId, issueId, pageId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Page linked",
        message: "The page has been linked to the work item.",
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "The page could not be linked. Please try again." });
    }
  };

  const handleRemovePage = async () => {
    if (!issuePage) return;
    try {
      await removePage(workspaceSlug, projectId, issueId, issuePage.id);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "The page could not be removed. Please try again.",
      });
    }
  };

  const handleCreatePage = async (name: string) => {
    try {
      const page = await projectPageService.create(workspaceSlug, projectId, { name, access: EPageAccess.PUBLIC });
      if (!page?.id) throw new Error("Page not created");
      await linkPage(workspaceSlug, projectId, issueId, page.id);
      // make sure the next dropdown open includes the new page
      setProjectPages(undefined);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Page created", message: "The page has been created and linked." });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "The page could not be created. Please try again.",
      });
      throw error;
    }
  };

  const handleChange = (value: string) => {
    if (value === CREATE_PAGE) {
      handleCreateModalToggle(true);
      return;
    }
    if (value === REMOVE_PAGE) {
      void handleRemovePage();
      return;
    }
    if (value && value !== issuePage?.page) void handleLinkPage(value);
  };

  const actionOptions = [
    {
      value: CREATE_PAGE,
      query: "create new page",
      content: (
        <div className="flex items-center gap-2 text-secondary">
          <FilePlus className="size-3.5 flex-shrink-0" />
          Create new page
        </div>
      ),
    },
    ...(issuePage
      ? [
          {
            value: REMOVE_PAGE,
            query: "remove page",
            content: (
              <div className="flex items-center gap-2 text-secondary">
                <X className="size-3.5 flex-shrink-0" />
                Remove page
              </div>
            ),
          },
        ]
      : []),
  ];

  const pageOptions = projectPages?.map((page) => ({
    value: page.id,
    query: getPageName(page.name),
    content: (
      <div className="flex items-center gap-2 truncate">
        <PageIcon className="size-3.5 flex-shrink-0 text-tertiary" />
        <span className="truncate">{getPageName(page.name)}</span>
      </div>
    ),
  }));

  const pagePicker = (customButton: React.ReactNode, customButtonClassName: string) => (
    <CustomSearchSelect
      value={issuePage?.page ?? null}
      onChange={handleChange}
      onOpen={fetchProjectPages}
      options={pageOptions ? [...actionOptions, ...pageOptions] : undefined}
      disabled={disabled}
      maxHeight="lg"
      noResultsMessage="No pages found"
      customButton={customButton}
      customButtonClassName={customButtonClassName}
    />
  );

  return (
    <>
      <CreateIssuePageModal
        isOpen={isCreateModalOpen}
        defaultName={issue?.name ?? ""}
        onClose={() => handleCreateModalToggle(false)}
        onSubmit={handleCreatePage}
      />
      <div className={cn("flex w-full items-center gap-1", className)}>
        {issuePage && linkedPageUrl ? (
          <>
            {/* a single click on the name opens the page, the chevron holds the actions */}
            <Link
              to={linkedPageUrl}
              className="flex h-7.5 min-w-0 flex-1 items-center gap-1.5 rounded-sm px-2 text-body-xs-regular hover:bg-layer-transparent-hover"
            >
              <PageIcon className="size-3.5 flex-shrink-0 text-tertiary" />
              <span className="truncate">{getPageName(issuePage.page_detail?.name)}</span>
            </Link>
            {!disabled &&
              pagePicker(
                <span className="grid size-6 flex-shrink-0 place-items-center rounded-sm text-tertiary hover:bg-layer-transparent-hover">
                  <ChevronDownIcon className="size-3.5" />
                </span>,
                "w-auto flex-shrink-0"
              )}
          </>
        ) : (
          pagePicker(
            <div className="flex h-7.5 w-full items-center gap-1.5 px-2 text-left text-body-xs-regular text-placeholder">
              Add page
            </div>,
            "w-full rounded-sm"
          )
        )}
      </div>
    </>
  );
});
