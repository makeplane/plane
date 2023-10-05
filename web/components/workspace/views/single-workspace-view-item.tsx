import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// icons
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { PhotoFilterOutlined } from "@mui/icons-material";
//components
import { CustomMenu } from "components/ui";
import { IWorkspaceView } from "types/workspace-views";
// helpers
import { truncateText } from "helpers/string.helper";

type Props = {
  view: IWorkspaceView;
  handleEditView: () => void;
  handleDeleteView: () => void;
};

export const SingleWorkspaceViewItem: React.FC<Props> = ({
  view,
  handleEditView,
  handleDeleteView,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const viewRedirectionUrl = `/${workspaceSlug}/workspace-views/issues?globalViewId=${view.id}`;

  return (
    <div className="group hover:bg-custom-background-90 border-b border-custom-border-200">
      <Link href={viewRedirectionUrl}>
        <a className="flex items-center justify-between relative rounded px-5 py-4 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded bg-custom-background-90 group-hover:bg-custom-background-100`}
              >
                <PhotoFilterOutlined className="!text-base !leading-6" />
              </div>
              <div className="flex flex-col">
                <p className="truncate text-sm leading-4 font-medium">
                  {truncateText(view.name, 75)}
                </p>
                {view?.description && (
                  <p className="text-xs text-custom-text-200">{view.description}</p>
                )}
              </div>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              <div className="flex items-center gap-4">
                <p className="rounded bg-custom-background-80 py-1 px-2 text-xs text-custom-text-200 opacity-0 group-hover:opacity-100">
                  {view.query_data.filters && Object.keys(view.query_data.filters).length > 0
                    ? `${Object.keys(view.query_data.filters)
                        .map((key: string) =>
                          view.query_data.filters[key as keyof typeof view.query_data.filters] !==
                          null
                            ? isNaN(
                                (
                                  view.query_data.filters[
                                    key as keyof typeof view.query_data.filters
                                  ] as any
                                ).length
                              )
                              ? 0
                              : (
                                  view.query_data.filters[
                                    key as keyof typeof view.query_data.filters
                                  ] as any
                                ).length
                            : 0
                        )
                        .reduce((curr, prev) => curr + prev, 0)} filters`
                    : "0 filters"}
                </p>
                <CustomMenu width="auto" ellipsis>
                  <CustomMenu.MenuItem
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditView();
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <PencilIcon className="h-3.5 w-3.5" />
                      <span>Edit View</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    onClick={(e: any) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteView();
                    }}
                  >
                    <span className="flex items-center justify-start gap-2">
                      <TrashIcon className="h-3.5 w-3.5" />
                      <span>Delete View</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
};
