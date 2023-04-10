import { useState } from "react";

import { useRouter } from "next/router";

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
import { EmptyState, Loader } from "components/ui";
// images
import emptyPage from "public/empty-state/empty-page.svg";
// types
import { IPage, TPageViewProps } from "types";
import {
  ALL_PAGES_LIST,
  FAVORITE_PAGES_LIST,
  MY_PAGES_LIST,
  RECENT_PAGES_LIST,
} from "constants/fetch-keys";
import { mutate } from "swr";

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

    mutate<IPage[]>(
      ALL_PAGES_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = true;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = true;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      FAVORITE_PAGES_LIST(projectId as string),
      (prevData) => [page, ...(prevData as IPage[])],
      false
    );

    pagesService
      .addPageToFavorites(workspaceSlug as string, projectId as string, {
        page: page.id,
      })
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId as string));
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

    mutate<IPage[]>(
      ALL_PAGES_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = false;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = false;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      FAVORITE_PAGES_LIST(projectId as string),
      (prevData) => (prevData ?? []).filter((p) => p.id !== page.id),
      false
    );

    pagesService
      .removePageFromFavorites(workspaceSlug as string, projectId as string, page.id)
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId as string));
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

  const partialUpdatePage = (page: IPage, formData: Partial<IPage>) => {
    if (!workspaceSlug || !projectId) return;

    mutate<IPage[]>(
      ALL_PAGES_LIST(projectId as string),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...formData })),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId as string),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...formData })),
      false
    );
    mutate<IPage[]>(
      FAVORITE_PAGES_LIST(projectId as string),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...formData })),
      false
    );

    pagesService
      .patchPage(workspaceSlug as string, projectId as string, page.id, formData)
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId as string));
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
      {pages ? (
        pages.length > 0 ? (
          viewType === "list" ? (
            <ul role="list" className="divide-y">
              {pages.map((page) => (
                <SinglePageListItem
                  key={page.id}
                  page={page}
                  handleEditPage={() => handleEditPage(page)}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleAddToFavorites={() => handleAddToFavorites(page)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                  partialUpdatePage={partialUpdatePage}
                />
              ))}
            </ul>
          ) : viewType === "detailed" ? (
            <div className="rounded-[10px] border divide-y  border-gray-200 bg-white">
              {pages.map((page) => (
                <SinglePageDetailedItem
                  key={page.id}
                  page={page}
                  handleEditPage={() => handleEditPage(page)}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleAddToFavorites={() => handleAddToFavorites(page)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                  partialUpdatePage={partialUpdatePage}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-gray-200 bg-white">
              {pages.map((page) => (
                <SinglePageDetailedItem
                  key={page.id}
                  page={page}
                  handleEditPage={() => handleEditPage(page)}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleAddToFavorites={() => handleAddToFavorites(page)}
                  handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                  partialUpdatePage={partialUpdatePage}
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState
            type="page"
            title="Create New Page"
            description="Create and document issues effortlessly in one place with Plane Notes, AI-powered for ease."
            imgURL={emptyPage}
          />
        )
      ) : viewType === "list" ? (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      ) : (
        <Loader className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
        </Loader>
      )}
    </>
  );
};
