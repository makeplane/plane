/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Button } from "@plane/propel/button";
import { CheckIcon, PageIcon, SearchIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, getPageName } from "@plane/utils";
// plane web hooks
import type { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageStore } from "@/plane-web/hooks/store";
// services
import { ProjectPageService } from "@/services/page";
// store
import type { TPageInstance } from "@/store/pages/base-page";

const projectPageService = new ProjectPageService();

type Props = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const MoveUnderPageModal = observer(function MoveUnderPageModal(props: Props) {
  const { isOpen, onClose, page, storeType } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getCurrentProjectPageIds, getPageById } = usePageStore(storeType);
  // derived values
  const projectId = page.project_ids?.[0];
  const projectPages = (projectId ? getCurrentProjectPageIds(projectId) : [])
    .map((pageId) => getPageById(pageId))
    .filter((projectPage): projectPage is TPageInstance => !!projectPage?.id && !projectPage.archived_at);
  // a page can't be moved under itself or any of its sub-pages
  const excludedPageIds = new Set<string>(page.id ? [page.id] : []);
  let foundNewDescendant = true;
  while (foundNewDescendant) {
    foundNewDescendant = false;
    for (const projectPage of projectPages) {
      if (projectPage.parent && excludedPageIds.has(projectPage.parent) && !excludedPageIds.has(projectPage.id!)) {
        excludedPageIds.add(projectPage.id!);
        foundNewDescendant = true;
      }
    }
  }
  const candidatePages = projectPages.filter(
    (projectPage) =>
      !excludedPageIds.has(projectPage.id!) &&
      getPageName(projectPage.name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClose = () => {
    onClose();
    setSearchTerm("");
  };

  const handleMove = async (parentId: string | null) => {
    if (!workspaceSlug || !projectId || !page.id) return;
    if ((page.parent ?? null) === parentId) return handleClose();
    setIsSubmitting(true);
    try {
      await projectPageService.update(workspaceSlug.toString(), projectId, page.id, { parent: parentId });
      page.mutateProperties({ parent: parentId });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Page moved",
        message: parentId ? `Moved under "${getPageName(getPageById(parentId)?.name)}".` : "Moved to the top level.",
      });
      handleClose();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: (error as { error?: string })?.error || "The page could not be moved. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOption = (key: string, label: string, parentId: string | null) => (
    <button
      key={key}
      type="button"
      disabled={isSubmitting}
      onClick={() => handleMove(parentId)}
      className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-13 text-secondary hover:bg-layer-1 hover:text-primary"
    >
      <span className="flex items-center gap-2 truncate">
        <PageIcon className={cn("size-4 flex-shrink-0 text-tertiary", { invisible: !parentId })} />
        <span className="truncate">{label}</span>
      </span>
      {(page.parent ?? null) === parentId && <CheckIcon className="size-3.5 flex-shrink-0" />}
    </button>
  );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="p-2">
        <h3 className="px-3 pt-3 text-14 font-medium text-primary">
          Move &quot;{getPageName(page.name)}&quot; under…
        </h3>
        <div className="relative m-1 mt-3">
          <SearchIcon className="pointer-events-none absolute top-3 left-3 size-4 text-placeholder" aria-hidden="true" />
          <input
            className="h-10 w-full rounded-md border-[0.5px] border-subtle bg-transparent pr-3 pl-9 text-13 text-primary outline-none placeholder:text-placeholder"
            placeholder="Search pages"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
        <div className="vertical-scrollbar scrollbar-md mt-2 max-h-80 overflow-y-auto">
          {searchTerm === "" && renderOption("top-level", "Top level (no parent)", null)}
          {candidatePages.map((candidatePage) =>
            renderOption(candidatePage.id!, getPageName(candidatePage.name), candidatePage.id!)
          )}
          {candidatePages.length === 0 && searchTerm !== "" && (
            <p className="p-4 text-center text-13 text-secondary">No pages found</p>
          )}
        </div>
        <div className="flex items-center justify-end p-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
