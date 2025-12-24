import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

export type TReadonlyStateProps = {
  className?: string;
  iconSize?: string;
  hideIcon?: boolean;
  value: string | undefined | null;
  placeholder?: string;
  projectId: string | undefined;
  workspaceSlug: string;
};

export const ReadonlyState = observer(function ReadonlyState(props: TReadonlyStateProps) {
  const { className, iconSize = "size-4", hideIcon = false, value, placeholder, projectId, workspaceSlug } = props;
  // states
  const [stateLoader, setStateLoader] = useState(false);
  const { t } = useTranslation();
  const { getStateById, getProjectStateIds, fetchProjectStates } = useProjectState();
  // derived values
  const stateIds = getProjectStateIds(projectId);
  const state = getStateById(value);

  // fetch states if not provided
  const fetchStates = async () => {
    if ((stateIds === undefined || stateIds.length === 0) && projectId) {
      setStateLoader(true);
      try {
        await fetchProjectStates(workspaceSlug, projectId);
      } finally {
        setStateLoader(false);
      }
    }
  };

  useEffect(() => {
    fetchStates();
  }, [projectId, workspaceSlug]);

  if (stateLoader) {
    return (
      <Loader className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
        <Loader.Item height="16px" width="16px" className="rounded-full" />
        <Loader.Item height="16px" width="50px" />
      </Loader>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 text-body-xs-regular", className)}>
      {!hideIcon && (
        <StateGroupIcon
          stateGroup={state?.group ?? "backlog"}
          className={cn(iconSize, "flex-shrink-0")}
          color={state?.color}
        />
      )}
      <span className="flex-grow truncate">{state?.name ?? placeholder ?? t("common.none")}</span>
    </div>
  );
});
