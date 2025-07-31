"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { X, Folder } from "lucide-react";
// plane web hooks
import { usePageFolderStore } from "@/plane-web/hooks/store";
// types
import { TPageFolder } from "@plane/types";

type TAddToFolderModal = {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
};

export const AddToFolderModal: FC<TAddToFolderModal> = observer((props) => {
  const { isOpen, onClose, pageId } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");

  // store hooks
  const { data: folders, addPageToFolder } = usePageFolderStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFolderId) return;

    setIsSubmitting(true);
    try {
      await addPageToFolder(selectedFolderId, pageId);
      setSelectedFolderId("");
      onClose();
    } catch (error) {
      console.error("Failed to add page to folder", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFolderId("");
    onClose();
  };

  const folderList = Object.values(folders);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium">Add to Folder</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="folder" className="block text-sm font-medium text-gray-700 mb-2">
              Select Folder
            </label>
            {folderList.length > 0 ? (
              <select
                id="folder"
                value={selectedFolderId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFolderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a folder...</option>
                {folderList.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No folders available</p>
                <p className="text-sm">Create a folder first to organize your pages</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFolderId || folderList.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding..." : "Add to Folder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
