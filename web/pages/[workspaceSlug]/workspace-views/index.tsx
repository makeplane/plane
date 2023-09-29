import React, { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { SingleWorkspaceViewItem } from "components/workspace/views/single-workspace-view-item";
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
import { CreateUpdateWorkspaceViewModal } from "components/workspace/views/modal";
import { DeleteWorkspaceViewModal } from "components/workspace/views/delete-workspace-view-modal";
// ui
import { EmptyState, Input, Loader, PrimaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "lucide-react";
import { PhotoFilterOutlined } from "@mui/icons-material";
// image
import emptyView from "public/empty-state/view.svg";
// types
import type { NextPage } from "next";
import { IWorkspaceView } from "types/workspace-views";
// constants
import { WORKSPACE_VIEWS_LIST } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const WorkspaceViews: NextPage = () => {
  const [query, setQuery] = useState("");

  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [selectedViewToUpdate, setSelectedViewToUpdate] = useState<IWorkspaceView | null>(null);

  const [deleteViewModal, setDeleteViewModal] = useState(false);
  const [selectedViewToDelete, setSelectedViewToDelete] = useState<IWorkspaceView | null>(null);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: workspaceViews } = useSWR(
    workspaceSlug ? WORKSPACE_VIEWS_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceService.getAllViews(workspaceSlug as string) : null
  );

  const defaultWorkspaceViewsList = [
    {
      key: "all",
      label: "All Issues",
      href: `/${workspaceSlug}/workspace-views/all-issues`,
    },
    {
      key: "assigned",
      label: "Assigned",
      href: `/${workspaceSlug}/workspace-views/assigned`,
    },
    {
      key: "created",
      label: "Created",
      href: `/${workspaceSlug}/workspace-views/created`,
    },
    {
      key: "subscribed",
      label: "Subscribed",
      href: `/${workspaceSlug}/workspace-views/subscribed`,
    },
  ];

  const filteredDefaultOptions =
    query === ""
      ? defaultWorkspaceViewsList
      : defaultWorkspaceViewsList?.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

  const filteredOptions =
    query === ""
      ? workspaceViews
      : workspaceViews?.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));

  const handleEditView = (view: IWorkspaceView) => {
    setSelectedViewToUpdate(view);
    setCreateUpdateViewModal(true);
  };

  const handleDeleteView = (view: IWorkspaceView) => {
    setSelectedViewToDelete(view);
    setDeleteViewModal(true);
  };

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Workspace Views</span>
        </div>
      }
      right={
        <div className="flex items-center gap-2">
          <WorkspaceIssuesViewOptions />

          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => setCreateUpdateViewModal(true)}
          >
            <PlusIcon className="h-4 w-4" />
            New View
          </PrimaryButton>
        </div>
      }
    >
      <CreateUpdateWorkspaceViewModal
        isOpen={createUpdateViewModal}
        handleClose={() => {
          setCreateUpdateViewModal(false);
          setSelectedViewToUpdate(null);
        }}
        data={selectedViewToUpdate}
      />
      <DeleteWorkspaceViewModal
        isOpen={deleteViewModal}
        data={selectedViewToDelete}
        setIsOpen={setDeleteViewModal}
      />
      <div className="flex flex-col">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 w-full px-5 py-3 border-b border-custom-border-200">
            <MagnifyingGlassIcon className="h-4 w-4 text-custom-text-200" />
            <Input
              className="w-full bg-transparent text-xs leading-5 text-custom-text-200 placeholder:text-custom-text-400 !p-0 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              mode="trueTransparent"
            />
          </div>
        </div>
        {filteredDefaultOptions &&
          filteredDefaultOptions.length > 0 &&
          filteredDefaultOptions.map((option) => (
            <div className="group hover:bg-custom-background-90 border-b border-custom-border-200">
              <Link href={option.href}>
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
                          {truncateText(option.label, 75)}
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          ))}

        {filteredOptions ? (
          filteredOptions.length > 0 ? (
            <div>
              {filteredOptions.map((view) => (
                <SingleWorkspaceViewItem
                  key={view.id}
                  view={view}
                  handleEditView={() => handleEditView(view)}
                  handleDeleteView={() => handleDeleteView(view)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Get focused with views"
              description="Views aid in saving your issues by applying various filters and grouping options."
              image={emptyView}
              primaryButton={{
                icon: <PlusIcon className="h-4 w-4" />,
                text: "New View",
                onClick: () => setCreateUpdateViewModal(true),
              }}
            />
          )
        ) : (
          <Loader className="space-y-1.5">
            <Loader.Item height="72px" />
            <Loader.Item height="72px" />
            <Loader.Item height="72px" />
            <Loader.Item height="72px" />
            <Loader.Item height="72px" />
          </Loader>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default WorkspaceViews;
