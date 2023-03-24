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
import { PAGE_LIST } from "constants/fetch-keys";
import Label from "./page-label";

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
          PAGE_LIST(projectId as string),
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
          PAGE_LIST(projectId as string),
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
    <div>
      <li>
        <div className="relative rounded px-4 py-4  sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
                <a className="after:absolute after:inset-0">
                  <p className="mr-2 truncate text-sm font-medium">{truncateText(page.name, 75)}</p>
                </a>
              </Link>
              <Label variant="green">Meetings</Label>
              <Label variant="red">Standup</Label>
              <Label variant="blue">Plans</Label>
            </div>

            <div className="ml-2 flex flex-shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">
                  {new Date(page.updated_at).toLocaleTimeString()}
                </p>
                {page.is_favorite ? (
                  <button onClick={handleRemoveFromFavorites} className="z-10">
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button onClick={handleAddToFavorites} type="button" className="z-10">
                    <StarIcon className="h-4 w-4 " color="#858E96" />
                  </button>
                )}
                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem onClick={handleEditPage}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Page</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeletePage}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete Page</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
          <div className="relative mt-6 space-y-2 text-sm leading-relaxed text-gray-600">
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis atque aliquam
              saepe sapiente illo ratione delectus dolorem repellat, id autem, molestiae neque
              quaerat ipsum perspiciatis pariatur? Unde consectetur quibusdam ut.
            </p>
            <p>
              Quisquam quas expedita cupiditate ipsum cumque fugit at, optio quia ea? Id doloribus
              assumenda ad magni laborum aut, aspernatur nemo similique, suscipit dolores porro
              necessitatibus, inventore ab aliquid molestias. Aspernatur.
            </p>
            <p>
              Beatae obcaecati minus temporibus sunt, quo nulla, tenetur nisi sit maiores aspernatur
              numquam facilis asperiores eos rerum, ad dolorem quos laboriosam dicta eaque! Pariatur
              magni eos, architecto itaque esse minus.
            </p>
            <p>
              Dolorum saepe impedit officiis odit! Porro aliquid dolorum corporis impedit eaque
              iusto, illo hic neque quia vero aperiam? Nemo aliquam, hic incidunt mollitia totam
              asperiores sunt nam inventore voluptatibus eum?
            </p>
            <div className="absolute bottom-0 h-24 w-full bg-gradient-to-t from-white" />
          </div>
        </div>
      </li>
    </div>
  );
};
