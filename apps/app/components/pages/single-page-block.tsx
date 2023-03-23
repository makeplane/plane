import { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import pagesService from "services/pages.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomMenu } from "components/ui";
// types
import { IPageBlock } from "types";
// fetch-keys
import { PAGE_BLOCK_LIST } from "constants/fetch-keys";

type Props = {
  pageBlock: IPageBlock;
};

export const SinglePageBlock: React.FC<Props> = ({ pageBlock }) => {
  const [name, setName] = useState(pageBlock.name);

  const router = useRouter();
  const { workspaceSlug, projectId, pageId } = router.query;

  const { setToastAlert } = useToast();

  const updatePageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .patchPageBlock(
        workspaceSlug as string,
        projectId as string,
        pageId as string,
        pageBlock.id,
        {
          name,
        }
      )
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
        console.log("Updated block");
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be updated. Please try again.",
        });
      });
  };

  const deletePageBlock = async () => {
    if (!workspaceSlug || !projectId || !pageId) return;

    await pagesService
      .deletePageBlock(workspaceSlug as string, projectId as string, pageId as string, pageBlock.id)
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
        console.log("deleted block");
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });
  };

  return (
    <li className="group flex justify-between rounded p-2 hover:bg-slate-100">
      <input
        type="text"
        value={name}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            console.log("Updating...");
            updatePageBlock();
          }
        }}
        onChange={(e) => {
          setName(e.target.value);
        }}
        className="border-none bg-transparent outline-none"
      />
      <div className="hidden group-hover:block">
        <CustomMenu>
          <CustomMenu.MenuItem>Convert to issue</CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={deletePageBlock}>Delete block</CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </li>
  );
};
