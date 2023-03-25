import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import pagesService from "services/pages.service";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// hooks
import useToast from "hooks/use-toast";
// types
import { IPage } from "types";
// fetch keys
import { RECENT_PAGES_LIST } from "constants/fetch-keys";

type TSingleStatProps = {
  page: IPage;
  handleEditPage: () => void;
  handleDeletePage: () => void;
};

export const SinglePageGridItem: React.FC<TSingleStatProps> = (props) => {
  const { page, handleEditPage, handleDeletePage } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleAddToFavorites = () => {
    if (!workspaceSlug && !projectId && !page) return;

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

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !page) return;

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

  return <div>Hi</div>;
};
