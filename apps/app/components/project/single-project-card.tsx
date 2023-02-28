import React from "react";

import { useRouter } from "next/router";
import Link from "next/link";

// hooks
import useProjectMembers from "hooks/use-project-members";
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, Loader } from "components/ui";
// icons
import { CalendarDaysIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
// helpers
import { renderShortNumericDateFormat } from "helpers/date-time.helper";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import type { IProject } from "types";

export type ProjectCardProps = {
  project: IProject;
  setToJoinProject: (id: string | null) => void;
  setDeleteProject: (id: string | null) => void;
};

export const SingleProjectCard: React.FC<ProjectCardProps> = ({
  project,
  setToJoinProject,
  setDeleteProject,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  // fetching project members information
  const { members, isMember, canDelete, canEdit } = useProjectMembers(
    workspaceSlug as string,
    project.id
  );

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${project.id}/issues`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      });
    });
  };

  return (
    <>
      {members ? (
        <Link href={`/${workspaceSlug as string}/projects/${project.id}/issues`}>
          <a className="shadow rounded-[10px]">
            <div
              className="relative h-32 bg-center bg-cover bg-no-repeat rounded-t-[10px]"
              style={{
                backgroundImage: `url(${
                  project.cover_image ??
                  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=874&q=80"
                })`,
              }}
            >
              <div className="absolute left-7 bottom-4 flex items-center gap-3 text-white">
                {!isMember ? (
                  <button
                    type="button"
                    onClick={() => {
                      setToJoinProject(project.id);
                    }}
                    className="flex cursor-pointer items-center gap-1 rounded border p-2 text-xs font-medium duration-300 hover:bg-gray-100"
                  >
                    <PlusIcon className="h-3 w-3" />
                    <span>Select to Join</span>
                  </button>
                ) : (
                  <span className="bg-[#09A953] px-2 py-1 rounded text-xs">Member</span>
                )}
                <span className="bg-[#f7ae59] h-6 w-9 grid place-items-center rounded">
                  <StarIcon className="h-3 w-3" />
                </span>
              </div>
            </div>
            <div className="px-7 py-4 rounded-b-[10px]">
              <div className="flex items-center justify-between">
                <div className="text-1.5xl font-semibold">{project.name}</div>
              </div>
              <p className="mt-3.5 mb-7">{project.description}</p>
              <div className="flex justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <CalendarDaysIcon className="h-4 w-4" />
                  {renderShortNumericDateFormat(project.created_at)}
                </div>
                {isMember ? (
                  <div className="flex items-center">
                    {canEdit && (
                      <Link href={`/${workspaceSlug}/projects/${project.id}/settings`}>
                        <a className="grid cursor-pointer place-items-center rounded p-1 duration-300 hover:bg-gray-100">
                          <PencilIcon className="h-4 w-4" />
                        </a>
                      </Link>
                    )}
                    {canDelete && (
                      <CustomMenu width="auto" verticalEllipsis>
                        <CustomMenu.MenuItem onClick={() => setDeleteProject(project.id)}>
                          Delete project
                        </CustomMenu.MenuItem>
                        <CustomMenu.MenuItem onClick={handleCopyText}>
                          Copy project link
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </a>
        </Link>
      ) : (
        <Loader>
          <Loader.Item height="144px" />
        </Loader>
      )}
    </>
  );
};
