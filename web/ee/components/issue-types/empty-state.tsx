import { FC, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// ui
import { AlertModalCore, Button, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useFlag, useIssueTypes, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TIssueTypeEmptyState = {
  workspaceSlug: string;
  projectId: string;
};

export const IssueTypeEmptyState: FC<TIssueTypeEmptyState> = observer((props) => {
  // props
  const { workspaceSlug, projectId } = props;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { enableIssueTypes } = useIssueTypes();
  const { toggleProPlanModal } = useWorkspaceSubscription();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [enableIssueTypeConfirmation, setEnableIssueTypeConfirmation] = useState<boolean>(false);
  // derived values
  const isIssueTypeSettingsEnabled = useFlag(workspaceSlug, "ISSUE_TYPE_SETTINGS");
  const resolvedEmptyStatePath = `/empty-state/issue-types/issue-type-${resolvedTheme === "light" ? "light" : "dark"}.svg`;
  // handlers
  const handleEnableIssueTypes = async () => {
    setIsLoading(true);
    await enableIssueTypes(workspaceSlug, projectId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issue types and custom properties are now enabled for this project",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to enable issue types",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={enableIssueTypeConfirmation}
        handleClose={() => setEnableIssueTypeConfirmation(false)}
        handleSubmit={() => handleEnableIssueTypes()}
        isSubmitting={isLoading}
        title="Once enabled, Issue Types can't be disabled."
        content={
          <>
            Plane&apos;s Issues will become the default issue type for this project and will show up with its icon and
            background in this project.{" "}
            <a
              href="https://docs.plane.so/core-concepts/issues/issue-types"
              target="_blank"
              className="font-medium hover:underline"
            >
              Read the docs
            </a>
            .
          </>
        }
        primaryButtonText={{
          loading: "Setting up",
          default: "Enable",
        }}
      />
      <div className="flex justify-center min-h-full overflow-y-auto py-10 px-5">
        <div className={cn("flex flex-col gap-5 md:min-w-[24rem] max-w-[45rem]")}>
          <div className="flex flex-col gap-1.5 flex-shrink">
            <h3 className="text-xl font-semibold">
              {isIssueTypeSettingsEnabled ? "Enable Issue Types" : "Upgrade to enable Issue Types."}
            </h3>
            <p className="text-sm text-custom-text-200">
              Shape issues to your work with Issue Types. Customize with icons, backgrounds, and properties and
              configure them for this project.
            </p>
          </div>
          <Image
            src={resolvedEmptyStatePath}
            alt="issue type empty state"
            width={384}
            height={250}
            layout="responsive"
            lazyBoundary="100%"
          />
          <div className="relative flex items-center justify-center gap-2 flex-shrink-0 w-full">
            {isIssueTypeSettingsEnabled ? (
              <Button disabled={isLoading} onClick={() => setEnableIssueTypeConfirmation(true)}>
                Enable
              </Button>
            ) : (
              <Button disabled={isLoading} onClick={() => toggleProPlanModal(true)}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
