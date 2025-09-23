import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { StateGroupIcon } from "@plane/propel/icons";
// components
import { DropdownButton } from "@/components/dropdowns/buttons";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  stateId: string;
};

export const StatePill = observer((props: Props) => {
  const { stateId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  // derived state
  const state = getStateById(stateId);

  return (
    <DropdownButton
      className="h-4 w-fit pointer-events-none bg-custom-background-100"
      tooltipContent={state?.name ?? t("common.state")}
      variant={"border-with-text"}
      isActive={false}
      tooltipHeading={t("common.state")}
      showTooltip={false}
    >
      <StateGroupIcon
        stateGroup={state?.group ?? "backlog"}
        color={state?.color ?? "rgba(var(--color-text-300))"}
        className="size-2 flex-shrink-0"
      />
      <span className="flex-grow truncate text-left text-xs text-custom-text-200">
        {state?.name ?? t("common.state")}
      </span>
    </DropdownButton>
  );
});
