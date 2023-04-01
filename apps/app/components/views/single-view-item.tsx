import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import { IView } from "types";

// icons
import { TrashIcon, StarIcon } from "@heroicons/react/24/outline";
import { StackedLayersIcon } from "components/icons";

//components
import { CustomMenu } from "components/ui";

import viewsService from "services/views.service";

import { mutate } from "swr";

import { VIEWS_LIST } from "constants/fetch-keys";

import useToast from "hooks/use-toast";

type Props = {
  view: IView;
  setSelectedView: React.Dispatch<React.SetStateAction<IView | null>>;
};

export const SingleViewItem: React.FC<Props> = ({ view, setSelectedView }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId || !view) return;

    mutate<IView[]>(
      VIEWS_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((v) => ({
          ...v,
          is_favorite: v.id === view.id ? true : v.is_favorite,
        })),
      false
    );

    viewsService
      .addViewToFavorites(workspaceSlug as string, projectId as string, {
        view: view.id,
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the view to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !view) return;

    mutate<IView[]>(
      VIEWS_LIST(projectId as string),
      (prevData) =>
        (prevData ?? []).map((v) => ({
          ...v,
          is_favorite: v.id === view.id ? false : v.is_favorite,
        })),
      false
    );

    viewsService
      .removeViewFromFavorites(workspaceSlug as string, projectId as string, view.id)
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the view from favorites. Please try again.",
        });
      });
  };

  return (
    <>
      <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>
        <div className="flex items-center cursor-pointer justify-between border-b bg-white p-4 first:rounded-t-[10px] last:rounded-b-[10px]">
          <div className="flex flex-col w-full gap-3">
            <div className="flex justify-between w-full">
              <div className="flex items-center gap-2">
                <StackedLayersIcon height={18} width={18} />
                <a>{view.name}</a>
              </div>
              <div className="flex">
                {view.is_favorite ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromFavorites();
                    }}
                  >
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToFavorites();
                    }}
                  >
                    <StarIcon className="h-4 w-4 " color="#858E96" />
                  </button>
                )}
                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedView(view);
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
            {view?.description && (
              <p className="text-sm text-[#858E96] font-normal leading-5 px-[27px]">
                {view.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </>
  );
};
