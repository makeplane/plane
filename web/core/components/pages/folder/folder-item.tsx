"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react";
// components
import { ListItem } from "@/components/core/list";
import { PageListBlock } from "@/components/pages/list";
// plane web hooks
import { EPageStoreType, usePageStore, usePageFolderStore } from "@/plane-web/hooks/store";
// types
import { TPageFolder } from "@plane/types";

type TFolderItem = {
  folder: TPageFolder;
  storeType: EPageStoreType;
};

export const FolderItem: FC<TFolderItem> = observer((props) => {
  const { folder, storeType } = props;
  const [isExpanded, setIsExpanded] = useState(false);

  // store hooks
  const { getPageById } = usePageStore(storeType);
  const { removePageFromFolder } = usePageFolderStore();

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRemovePageFromFolder = async (pageId: string) => {
    try {
      await removePageFromFolder(folder.id, pageId);
    } catch (error) {
      console.error("Failed to remove page from folder", error);
    }
  };

  const pagesInFolder = folder.page_ids?.map((pageId) => getPageById(pageId)).filter(Boolean) || [];

  return (
    <div className="space-y-1">
      <ListItem
        prependTitleElement={
          <button
            onClick={handleToggleExpand}
            className="flex items-center gap-2 text-custom-text-300 hover:text-custom-text-100 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-custom-primary-100" />
            ) : (
              <Folder className="h-4 w-4 text-custom-primary-100" />
            )}
          </button>
        }
        title={folder.name}
        itemLink="#"
        actionableItems={
          <div className="flex items-center gap-2">
            <span className="text-xs text-custom-text-400">
              {pagesInFolder.length} {pagesInFolder.length === 1 ? "page" : "pages"}
            </span>
            {folder.description && (
              <span className="text-xs text-custom-text-400 truncate max-w-32">{folder.description}</span>
            )}
          </div>
        }
        parentRef={{ current: null }}
        disableLink={true}
      />

      {isExpanded && (
        <div className="ml-6 space-y-1">
          {pagesInFolder.length > 0 ? (
            pagesInFolder.map((page) => (
              <div key={page?.id} className="relative">
                <PageListBlock pageId={page?.id || ""} storeType={storeType} />
                <button
                  onClick={() => page?.id && handleRemovePageFromFolder(page.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-custom-text-400 hover:text-custom-text-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-custom-text-400 py-2 px-4">No pages in this folder</div>
          )}
        </div>
      )}
    </div>
  );
});
