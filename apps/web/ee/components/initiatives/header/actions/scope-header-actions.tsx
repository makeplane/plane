import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { EIssueLayoutTypes } from "@plane/types";
import { Button } from "@plane/ui";
import { LayoutSelection } from "@/components/issues";
import { AddScopeButton } from "@/plane-web/components/initiatives/common/add-scope-button";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeScopeHeaderActions = observer(({ workspaceSlug, initiativeId, disabled }: Props) => {
  const { t } = useTranslation();

  const {
    initiative: {
      scope: { getDisplayFilters, updateDisplayFilters },
    },
  } = useInitiatives();

  const displayFilters = getDisplayFilters(initiativeId);

  const activeLayout = displayFilters?.activeLayout;

  // handle layout change
  const handleLayoutChange = (layout: EIssueLayoutTypes) => {
    updateDisplayFilters(initiativeId, { activeLayout: layout });
  };

  return (
    <div className="flex items-center gap-2">
      <LayoutSelection
        layouts={[EIssueLayoutTypes.LIST, EIssueLayoutTypes.GANTT]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
      <AddScopeButton
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={disabled}
        customButton={<Button>{t("initiatives.scope.add_scope")}</Button>}
      />
    </div>
  );
});
