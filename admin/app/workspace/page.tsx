"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Loader as LoaderIcon } from "lucide-react";
// types
import { TInstanceConfigurationKeys } from "@plane/types";
// ui
import { Button, getButtonStyling, Loader, setPromiseToast, ToggleSwitch } from "@plane/ui";
// components
import { WorkspaceListItem } from "@/components/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";

const WorkspaceManagementPage = observer(() => {
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // store
  const { formattedConfig, fetchInstanceConfigurations, updateInstanceConfigurations } = useInstance();
  const {
    workspaceIds,
    loader: workspaceLoader,
    paginationInfo,
    fetchWorkspaces,
    fetchNextWorkspaces,
  } = useWorkspace();
  // derived values
  const disableWorkspaceCreation = formattedConfig?.DISABLE_WORKSPACE_CREATION ?? "";
  const hasNextPage = paginationInfo?.next_page_results && paginationInfo?.next_cursor !== undefined;

  // fetch data
  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());
  useSWR("INSTANCE_WORKSPACES", () => fetchWorkspaces());

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving configuration",
      success: {
        title: "Success",
        message: () => "Configuration saved successfully",
      },
      error: {
        title: "Error",
        message: () => "Failed to save configuration",
      },
    });

    await updateConfigPromise
      .then(() => {
        setIsSubmitting(false);
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="relative container mx-auto w-full h-full p-4 py-4 space-y-6 flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-custom-border-100 mx-4 py-4 space-y-1 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-medium text-custom-text-100">Workspaces on this instance</div>
          <div className="text-sm font-normal text-custom-text-300">
            See all workspaces and control who can create them.
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-hidden overflow-y-scroll vertical-scrollbar scrollbar-md px-4">
        <div className="space-y-3">
          {formattedConfig ? (
            <div className={cn("w-full flex items-center gap-14 rounded")}>
              <div className="flex grow items-center gap-4">
                <div className="grow">
                  <div className="text-lg font-medium pb-1">Prevent anyone else from creating a workspace.</div>
                  <div className={cn("font-normal leading-5 text-custom-text-300 text-xs")}>
                    Toggling this on will let only you create workspaces. You will have to invite users to new
                    workspaces.
                  </div>
                </div>
              </div>
              <div className={`shrink-0 pr-4 ${isSubmitting && "opacity-70"}`}>
                <div className="flex items-center gap-4">
                  <ToggleSwitch
                    value={Boolean(parseInt(disableWorkspaceCreation))}
                    onChange={() => {
                      if (Boolean(parseInt(disableWorkspaceCreation)) === true) {
                        updateConfig("DISABLE_WORKSPACE_CREATION", "0");
                      } else {
                        updateConfig("DISABLE_WORKSPACE_CREATION", "1");
                      }
                    }}
                    size="sm"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Loader>
              <Loader.Item height="50px" width="100%" />
            </Loader>
          )}
          {workspaceLoader !== "init-loader" ? (
            <>
              <div className="pt-6 flex items-center justify-between gap-2">
                <div className="flex flex-col items-start gap-x-2">
                  <div className="flex items-center gap-2 text-lg font-medium">
                    All workspaces on this instance{" "}
                    <span className="text-custom-text-300">• {workspaceIds.length}</span>
                    {workspaceLoader && ["mutation", "pagination"].includes(workspaceLoader) && (
                      <LoaderIcon className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                  <div className={cn("font-normal leading-5 text-custom-text-300 text-xs")}>
                    You can&apos;t yet delete workspaces and you can only go to the workspace if you are an Admin or a
                    Member.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/workspace/create" className={getButtonStyling("primary", "sm")}>
                    Create workspace
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-4 py-2">
                {workspaceIds.map((workspaceId) => (
                  <WorkspaceListItem key={workspaceId} workspaceId={workspaceId} />
                ))}
              </div>
              {hasNextPage && (
                <div className="flex justify-center">
                  <Button
                    variant="link-primary"
                    onClick={() => fetchNextWorkspaces()}
                    disabled={workspaceLoader === "pagination"}
                  >
                    Load more
                    {workspaceLoader === "pagination" && <LoaderIcon className="w-3 h-3 animate-spin" />}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Loader className="space-y-10 py-8">
              <Loader.Item height="24px" width="20%" />
              <Loader.Item height="92px" width="100%" />
              <Loader.Item height="92px" width="100%" />
              <Loader.Item height="92px" width="100%" />
            </Loader>
          )}
        </div>
      </div>
    </div>
  );
});

export default WorkspaceManagementPage;
