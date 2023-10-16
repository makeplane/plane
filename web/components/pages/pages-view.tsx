import { useState } from "react";

import useSWR, { mutate } from "swr";
import { useRouter } from "next/router";

// services
import { PageService } from "services/page.service";
import { ProjectService } from "services/project";
// hooks
import useToast from "hooks/use-toast";
import useUserAuth from "hooks/use-user-auth";
// components
import { CreateUpdatePageModal, DeletePageModal, SinglePageDetailedItem, SinglePageListItem } from "components/pages";
// ui
import { EmptyState } from "components/common";
import { Loader } from "@plane/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyPage from "public/empty-state/page.svg";
// types
import { IPage, TPageViewProps } from "types";
import {
  ALL_PAGES_LIST,
  FAVORITE_PAGES_LIST,
  MY_PAGES_LIST,
  PROJECT_MEMBERS,
  RECENT_PAGES_LIST,
} from "constants/fetch-keys";

type Props = {
  pages: IPage[] | undefined;
  viewType: TPageViewProps;
};

// services
const pageService = new PageService();
const projectService = new ProjectService();

export const PagesView: React.FC<Props> = ({ pages, viewType }) => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [selectedPageToUpdate, setSelectedPageToUpdate] = useState<IPage | null>(null);

  const [deletePageModal, setDeletePageModal] = useState(false);
  const [selectedPageToDelete, setSelectedPageToDelete] = useState<IPage | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { setToastAlert } = useToast();

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );

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
      ALL_PAGES_LIST(projectId.toString()),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = true;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId.toString()),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = true;

          return p;
        }),
      false
    );
    mutate<IPage[]>(FAVORITE_PAGES_LIST(projectId.toString()), (prevData) => [page, ...(prevData ?? [])], false);

    pageService
      .addPageToFavorites(workspaceSlug.toString(), projectId.toString(), {
        page: page.id,
      })
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId.toString()));
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
      ALL_PAGES_LIST(projectId.toString()),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = false;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId.toString()),
      (prevData) =>
        (prevData ?? []).map((p) => {
          if (p.id === page.id) p.is_favorite = false;

          return p;
        }),
      false
    );
    mutate<IPage[]>(
      FAVORITE_PAGES_LIST(projectId.toString()),
      (prevData) => (prevData ?? []).filter((p) => p.id !== page.id),
      false
    );

    pageService
      .removePageFromFavorites(workspaceSlug.toString(), projectId.toString(), page.id)
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId.toString()));
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
      ALL_PAGES_LIST(projectId.toString()),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...(p.id === page.id ? formData : {}) })),
      false
    );
    mutate<IPage[]>(
      MY_PAGES_LIST(projectId.toString()),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...(p.id === page.id ? formData : {}) })),
      false
    );
    mutate<IPage[]>(
      FAVORITE_PAGES_LIST(projectId.toString()),
      (prevData) => (prevData ?? []).map((p) => ({ ...p, ...(p.id === page.id ? formData : {}) })),
      false
    );

    pageService.patchPage(workspaceSlug.toString(), projectId.toString(), page.id, formData, user).then(() => {
      mutate(RECENT_PAGES_LIST(projectId.toString()));
    });
  };

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        data={selectedPageToUpdate}
        user={user}
      />
      <DeletePageModal
        isOpen={deletePageModal}
        setIsOpen={setDeletePageModal}
        data={selectedPageToDelete}
        user={user}
      />
      {pages ? (
        <div className="space-y-4 h-full overflow-y-auto">
          {pages.length > 0 ? (
            viewType === "list" ? (
              <ul role="list" className="divide-y divide-custom-border-200">
                {pages.map((page) => (
                  <SinglePageListItem
                    key={page.id}
                    page={page}
                    people={people}
                    handleEditPage={() => handleEditPage(page)}
                    handleDeletePage={() => handleDeletePage(page)}
                    handleAddToFavorites={() => handleAddToFavorites(page)}
                    handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                    partialUpdatePage={partialUpdatePage}
                  />
                ))}
              </ul>
            ) : viewType === "detailed" ? (
              <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200 bg-custom-background-100">
                {pages.map((page) => (
                  <SinglePageDetailedItem
                    key={page.id}
                    page={page}
                    people={people}
                    handleEditPage={() => handleEditPage(page)}
                    handleDeletePage={() => handleDeletePage(page)}
                    handleAddToFavorites={() => handleAddToFavorites(page)}
                    handleRemoveFromFavorites={() => handleRemoveFromFavorites(page)}
                    partialUpdatePage={partialUpdatePage}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[10px] border border-custom-border-200">
                {pages.map((page) => (
                  <SinglePageDetailedItem
                    key={page.id}
                    page={page}
                    people={people}
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
              title="Have your thoughts in place"
              description="You can think of Pages as an AI-powered notepad."
              image={emptyPage}
              primaryButton={{
                icon: <PlusIcon className="h-4 w-4" />,
                text: "New Page",
                onClick: () => {
                  const e = new KeyboardEvent("keydown", {
                    key: "d",
                  });
                  document.dispatchEvent(e);
                },
              }}
            />
          )}
        </div>
      ) : viewType === "list" ? (
        <Loader className="space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      ) : viewType === "detailed" ? (
        <Loader className="space-y-4">
          <Loader.Item height="150px" />
          <Loader.Item height="150px" />
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
