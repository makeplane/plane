/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Files, Folder } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { ICustomSearchSelectOption } from "@plane/types";
import { Breadcrumbs, BreadcrumbNavigationSearchDropdown } from "@plane/ui";
// hooks
import { useFileLibrary } from "@/hooks/store/use-file-library";

const ROOT_KEY = "root";

type Props = {
  currentFolderId: string | null;
  /** navigate to a folder id (null = library root) */
  onNavigate: (folderId: string | null) => void;
};

/**
 * Folder breadcrumb trail where each crumb is a searchable dropdown of its
 * sibling folders — so the user can jump laterally between folders without
 * going back (mirrors Plane's page/cycle breadcrumb switcher).
 */
export const FolderBreadcrumbs = observer(function FolderBreadcrumbs(props: Props) {
  const { currentFolderId, onNavigate } = props;
  const { t } = useTranslation();
  const { folderIds, getFolderById, getFolderPath } = useFileLibrary();

  const trail = getFolderPath(currentFolderId);

  // Sibling folders of a given parent, as dropdown options
  const siblingOptions = (parentId: string | null): ICustomSearchSelectOption[] =>
    folderIds
      .map((id) => getFolderById(id))
      .filter((folder) => folder && (folder.parent ?? null) === parentId)
      .map((folder) => ({
        value: folder!.id,
        query: folder!.name,
        content: (
          <span className="flex items-center gap-2">
            <Folder className="size-3.5 text-tertiary" />
            {folder!.name}
          </span>
        ),
      }));

  return (
    // Overrides the component's own flex-grow/overflow-hidden: the trail can
    // get many levels deep, so it should report its true width and let the
    // scrollable wrapper (in root.tsx) handle overflow instead of clipping.
    <Breadcrumbs className="w-max flex-none overflow-visible">
      {/* Root — switch between top-level folders or jump to the root */}
      <Breadcrumbs.Item
        // The dropdown already renders its own chevron/separator (it doubles as
        // the "expand" affordance) — showSeparator would draw a second one.
        showSeparator={false}
        component={
          <BreadcrumbNavigationSearchDropdown
            selectedItem={currentFolderId === null ? ROOT_KEY : ""}
            navigationItems={siblingOptions(null)}
            onChange={(value: string) => onNavigate(value === ROOT_KEY ? null : value)}
            title={t("file_library.title")}
            icon={
              <Breadcrumbs.Icon>
                <Files className="size-4 text-tertiary" />
              </Breadcrumbs.Icon>
            }
            handleOnClick={() => onNavigate(null)}
            isLast={trail.length === 0}
          />
        }
        isLast={trail.length === 0}
      />
      {trail.map((folder, index) => {
        const isLast = index === trail.length - 1;
        return (
          <Breadcrumbs.Item
            key={folder.id}
            showSeparator={false}
            component={
              <BreadcrumbNavigationSearchDropdown
                selectedItem={folder.id}
                navigationItems={siblingOptions(folder.parent ?? null)}
                onChange={(value: string) => onNavigate(value)}
                title={folder.name}
                icon={
                  <Breadcrumbs.Icon>
                    <Folder className="size-4 text-tertiary" />
                  </Breadcrumbs.Icon>
                }
                handleOnClick={() => onNavigate(folder.id)}
                isLast={isLast}
              />
            }
            isLast={isLast}
          />
        );
      })}
    </Breadcrumbs>
  );
});
