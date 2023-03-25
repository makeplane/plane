import { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  CreateUpdatePageModal,
  DeletePageModal,
  SinglePageDetailedItem,
  SinglePageListItem,
} from "components/pages";
// ui
import { Loader } from "components/ui";
// types
import { IPage, TPageViewProps } from "types";
// fetch-keys
import { RECENT_PAGES_LIST } from "constants/fetch-keys";

type Props = {
  pages: IPage[] | undefined;
  viewType: TPageViewProps;
};

export const PagesView: React.FC<Props> = ({ pages, viewType }) => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [selectedPageToUpdate, setSelectedPageToUpdate] = useState<IPage | null>(null);

  const [deletePageModal, setDeletePageModal] = useState(false);
  const [selectedPageToDelete, setSelectedPageToDelete] = useState<IPage | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleEditPage = (page: IPage) => {
    setSelectedPageToUpdate(page);
    setCreateUpdatePageModal(true);
  };

  const handleDeletePage = (page: IPage) => {
    setSelectedPageToDelete(page);
    setDeletePageModal(true);
  };

  const handleAddToFavorites = (page: IPage) => {
    if (!workspaceSlug || !projectId) return;

    pagesService
      .addPageToFavorites(workspaceSlug as string, projectId as string, {
        page: page.id,
      })
      .then(() => {
        mutate<IPage[]>(
          RECENT_PAGES_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((m) => ({
              ...m,
              is_favorite: m.id === page.id ? true : m.is_favorite,
            })),
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the page to favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the page to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = (page: IPage) => {
    if (!workspaceSlug || !projectId) return;

    pagesService
      .removePageFromFavorites(workspaceSlug as string, projectId as string, page.id)
      .then(() => {
        mutate<IPage[]>(
          RECENT_PAGES_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((m) => ({
              ...m,
              is_favorite: m.id === page.id ? false : m.is_favorite,
            })),
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the page from favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the page from favorites. Please try again.",
        });
      });
  };

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        data={selectedPageToUpdate}
      />
      <DeletePageModal
        isOpen={deletePageModal}
        setIsOpen={setDeletePageModal}
        data={selectedPageToDelete}
      />
      {viewType === "list" ? (
        pages ? (
          pages.length > 0 ? (
            <ul role="list" className="divide-y">
              {pages.map((page) => (
                <SinglePageListItem
                  key={page.id}
                  page={page}
                  handleEditPage={() => handleEditPage(page)}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleAddToFavorites={() => handleAddToFavorites(page)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-center">No pages found</p>
          )
        ) : (
          <Loader className="mt-8 space-y-4">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )
      ) : viewType === "detailed" ? (
        pages ? (
          pages.length > 0 ? (
            <div className="rounded-[10px] border border-gray-200 bg-white">
              {pages.map((page) => (
                <SinglePageDetailedItem
                  key={page.id}
                  page={page}
                  handleEditPage={() => handleEditPage(page)}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleAddToFavorites={() => handleAddToFavorites(page)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-center">No pages found</p>
          )
        ) : (
          <Loader className="mt-8 space-y-4">
            <Loader.Item height="200px" />
            <Loader.Item height="200px" />
          </Loader>
        )
      ) : pages ? (
        pages.length > 0 ? (
          <div className="rounded-[10px] border border-gray-200 bg-white">
            {pages.map((page) => (
              <SinglePageDetailedItem
                key={page.id}
                page={page}
                handleEditPage={() => handleEditPage(page)}
                handleDeletePage={() => handleDeletePage(page)}
                handleAddToFavorites={() => handleAddToFavorites(page)}
                handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-center">No pages found</p>
        )
      ) : (
        <Loader className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
        </Loader>
      )}
    </>
  );
};
