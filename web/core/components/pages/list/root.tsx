import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Plus, Folder } from "lucide-react";
// types
import { TPageNavigationTabs } from "@plane/types";
// components
import { ListLayout } from "@/components/core/list";
// plane web hooks
import { EPageStoreType, usePageStore, usePageFolderStore } from "@/plane-web/hooks/store";
// components
import { PageListBlock } from "./";
import { FolderItem } from "@/components/pages/folder/folder-item";
import { CreateFolderModal } from "@/components/pages/folder/create-folder-modal";

type TPagesListRoot = {
  pageType: TPageNavigationTabs;
  storeType: EPageStoreType;
};

export const PagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { pageType, storeType } = props;
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);

  // store hooks
  const { getCurrentProjectFilteredPageIds } = usePageStore(storeType);
  const { getFoldersByProject } = usePageFolderStore();

  // derived values
  const filteredPageIds = getCurrentProjectFilteredPageIds(pageType);
  const folders = getFoldersByProject(""); // We'll need to get projectId from context

  // Separate pages that are in folders from those that aren't
  const pagesInFolders = new Set();
  folders.forEach((folder) => {
    folder.page_ids?.forEach((pageId) => pagesInFolders.add(pageId));
  });

  const pagesNotInFolders = filteredPageIds?.filter((pageId) => !pagesInFolders.has(pageId)) || [];

  const handleCreateFolder = () => {
    setIsCreateFolderModalOpen(true);
  };

  const handleCloseCreateFolderModal = () => {
    setIsCreateFolderModalOpen(false);
  };

  if (!filteredPageIds) return <></>;

  return (
    <>
      <ListLayout>
        {/* Folders */}
        {folders.length > 0 && (
          <div className="space-y-2">
            {folders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} storeType={storeType} />
            ))}
          </div>
        )}

        {/* Create Folder Button */}
        <div className="flex items-center justify-center py-4">
          <button
            onClick={handleCreateFolder}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <Folder className="h-4 w-4" />
            Create Folder
          </button>
        </div>

        {/* Pages not in folders */}
        {pagesNotInFolders.length > 0 && (
          <div className="space-y-1">
            {pagesNotInFolders.map((pageId) => (
              <PageListBlock key={pageId} pageId={pageId} storeType={storeType} />
            ))}
          </div>
        )}
      </ListLayout>

      <CreateFolderModal isOpen={isCreateFolderModalOpen} onClose={handleCloseCreateFolderModal} />
    </>
  );
});
