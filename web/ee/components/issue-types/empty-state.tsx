import { FC, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useTheme } from "next-themes";
// ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
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
    <div className="flex justify-center min-h-full overflow-y-auto py-10 px-5">
      <div className={cn("flex flex-col gap-5 md:min-w-[24rem] max-w-[45rem]")}>
        <div className="flex flex-col gap-1.5 flex-shrink">
          <h3 className="text-xl font-semibold">
            {isIssueTypeSettingsEnabled ? "Enable issue types" : "Upgrade to enable issue types"}
          </h3>
          <p className="text-sm text-custom-text-200">
            Issue types distinguish different kinds of work in unique ways, helping you to identify, categorize, and
            report on your team{"’"}s work more effectively.
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
            <Button disabled={isLoading} onClick={() => handleEnableIssueTypes()}>
              {isLoading ? "Setting up..." : "Enable"}
            </Button>
          ) : (
            <Button disabled={isLoading} onClick={() => toggleProPlanModal(true)}>
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
