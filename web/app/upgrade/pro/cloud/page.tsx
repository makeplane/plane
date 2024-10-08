"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import Link from "next/link";
import { useTheme } from "next-themes";
import useSWR from "swr";
import { Button, TOAST_TYPE, Tooltip, getButtonStyling, setToast } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { RadioInput } from "@/components/estimates";
// helpers
import { cn } from "@/helpers/common.helper";
import { truncateText } from "@/helpers/string.helper";
// hooks
import { useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// services
import { WorkspaceService } from "@/plane-web/services";
// plane web types
import { TWorkspaceWithProductDetails } from "@/plane-web/types/workspace";

const workspaceService = new WorkspaceService();

const CloudUpgradePage = observer(() => {
  // router
  const router = useAppRouter();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  // hooks
  const { data: currentUser, signOut } = useUser();
  // next themes
  const { setTheme } = useTheme();

  const { data: workspacesList, isLoading: isFetching } = useSWR(
    currentUser ? `CLOUD_PRO_WORKSPACES_LIST` : null,
    currentUser ? () => workspaceService.getWorkspacesWithPlanDetails() : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (isFetching) {
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );
  }

  const isAnyWorkspaceAvailable = workspacesList && workspacesList?.length > 0;

  const handleNextStep = () => {
    router.push(`/upgrade/pro/cloud/${selectedWorkspace}`);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut()
      .then(() => {
        setTheme("system");
        router.push("/");
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => setIsLoading(false));
  };

  const workspaceSubscription = (workspace: TWorkspaceWithProductDetails): "FREE" | "PRO" | "TRIAL" => {
    switch (workspace.product) {
      case "PRO":
        if (workspace.is_on_trial) {
          return "TRIAL";
        } else return "PRO";
      case "FREE":
        return "FREE";
      default:
        return "FREE";
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <RadioInput
        name="workspace-upgrade-radio-input"
        label={
          <div className="flex flex-col items-center gap-2 pb-4">
            <div className="text-center text-3xl font-semibold">
              {isAnyWorkspaceAvailable
                ? "Choose your workspace"
                : "We didn't find an eligible workspace for this upgrade. Try another email address."}
            </div>
            <div className="text-center text-base text-custom-text-300">
              {isAnyWorkspaceAvailable
                ? `We found the following workspaces eligible for Pro. If you want to upgrade a different workspace, log in
              with that email and make sure you are an admin of the workspace you want to upgrade.`
                : `We couldn't find any Pro eligible workspace. Try a different email address and make sure you are an admin of the workspace you want to upgrade.`}
            </div>
          </div>
        }
        options={
          isAnyWorkspaceAvailable
            ? workspacesList.map((workspace) => ({
                label: (
                  <div className={`flex items-center gap-3 px-1`}>
                    <div className="flex-shrink-0">
                      <div className="relative grid h-7 w-7 place-items-center rounded">
                        {workspace?.logo && workspace.logo !== "" ? (
                          <img
                            src={workspace.logo}
                            className="absolute left-0 top-0 h-full w-full rounded object-cover"
                            alt={workspace.name}
                          />
                        ) : (
                          <span className="grid h-7 w-7 justify-center place-items-center rounded bg-gray-700 px-3 py-1.5 uppercase text-sm text-white">
                            {workspace?.name[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{truncateText(workspace?.name, 40)}</div>
                    </div>

                    {/* pro */}
                    {workspaceSubscription(workspace) === "PRO" && (
                      <div className="flex-shrink-0">
                        <Tooltip position="right" tooltipContent="This workspace is already subscribed to Pro.">
                          <div
                            className={cn(
                              "text-[#EA9924] bg-[#FFF7C2] rounded-md px-2 py-0 text-center text-xs font-medium outline-none"
                            )}
                          >
                            Pro
                          </div>
                        </Tooltip>
                      </div>
                    )}

                    {/* trial */}
                    {workspaceSubscription(workspace) === "TRIAL" && (
                      <div className="flex-shrink-0">
                        <Tooltip position="right" tooltipContent="This workspace is in Trial please upgrade to Pro.">
                          <div
                            className={cn(
                              "text-custom-primary-100 bg-custom-primary-100/20 rounded-md px-2 py-0 text-center text-xs font-medium outline-none"
                            )}
                          >
                            Trial
                          </div>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                ),
                value: workspace.slug,
                disabled: workspace.is_billing_active,
              }))
            : []
        }
        className="w-full"
        wrapperClassName={cn({
          "w-full max-h-72 overflow-auto vertical-scrollbar scrollbar-sm flex flex-col gap-5 p-5 border border-custom-border-200 rounded-md":
            isAnyWorkspaceAvailable,
        })}
        buttonClassName="size-3.5 mt-0.5"
        selected={selectedWorkspace}
        onChange={(value) => setSelectedWorkspace(value)}
      />
      {isAnyWorkspaceAvailable ? (
        <Button
          className="w-full px-2 my-4"
          onClick={handleNextStep}
          loading={isLoading}
          disabled={isLoading || !selectedWorkspace}
        >
          {isLoading ? "Going to payment" : "Choose billing frequency"}
        </Button>
      ) : (
        <div className="w-full flex gap-4 px-4">
          <Button className="w-full px-2" onClick={handleSignOut} loading={isLoading} disabled={isLoading}>
            Try another email address
          </Button>
          <Link href="/create-workspace" className={cn(getButtonStyling("outline-primary", "md"), "w-full px-2")}>
            Create a new workspace
          </Link>
        </div>
      )}
    </div>
  );
});

export default CloudUpgradePage;
