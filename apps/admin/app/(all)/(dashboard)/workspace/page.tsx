import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Loader as LoaderIcon } from "lucide-react";
// types
import { Button, getButtonStyling } from "@plane/propel/button";
import { setPromiseToast } from "@plane/propel/toast";
import type { TInstanceConfigurationKeys } from "@plane/types";
import { Loader, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceListItem } from "@/components/workspace/list-item";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const WorkspaceManagementPage = observer(function WorkspaceManagementPage(_props: Route.ComponentProps) {
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
    <PageWrapper
      header={{
        title: "Workspaces on this instance",
        description: "See all workspaces and control who can create them.",
      }}
    >
      <div className="space-y-3">
        {formattedConfig ? (
          <div className={cn("w-full flex items-center gap-14 rounded-sm")}>
            <div className="flex grow items-center gap-4">
              <div className="grow">
                <div className="text-16 font-medium pb-1">Prevent anyone else from creating a workspace.</div>
                <div className={cn("font-regular leading-5 text-tertiary text-11")}>
                  Toggling this on will let only you create workspaces. You will have to invite users to new workspaces.
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
                <div className="flex items-center gap-2 text-16 font-medium">
                  All workspaces on this instance <span className="text-tertiary">• {workspaceIds.length}</span>
                  {workspaceLoader && ["mutation", "pagination"].includes(workspaceLoader) && (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  )}
                </div>
                <div className={cn("font-regular leading-5 text-tertiary text-11")}>
                  You can&apos;t yet delete workspaces and you can only go to the workspace if you are an Admin or a
                  Member.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/workspace/create" className={getButtonStyling("primary", "base")}>
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
                  variant="link"
                  size="lg"
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
    </PageWrapper>
  );
});

export const meta: Route.MetaFunction = () => [{ title: "Workspace Management - God Mode" }];

export default WorkspaceManagementPage;
