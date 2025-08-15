import { useRef } from "react";
import { observer } from "mobx-react";
import { Loader as Spinner } from "lucide-react";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TBaseTemplateWithData } from "@plane/types";
import { Button } from "@plane/ui";
// plane web imports
import { useWorkspace } from "@/hooks/store/use-workspace";
import { IBaseTemplateStore } from "@/plane-web/store/templates";
// local imports
import { TemplateQuickActions } from "./quick-actions";

type TemplateListItemProps<T extends TBaseTemplateWithData> = {
  templateId: string;
  workspaceSlug: string;
  currentLevel: ETemplateLevel;
  selectedTemplateId: string | null;
  getTemplateById: IBaseTemplateStore<T>["getTemplateById"];
  deleteTemplate: (templateId: string) => Promise<void>;
  handleUseTemplateAction: () => void;
};

export const TemplateListItem = observer(<T extends TBaseTemplateWithData>(props: TemplateListItemProps<T>) => {
  const {
    templateId,
    workspaceSlug,
    currentLevel,
    selectedTemplateId,
    getTemplateById,
    deleteTemplate,
    handleUseTemplateAction,
  } = props;
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const template = getTemplateById(templateId);
  const workspace = getWorkspaceBySlug(workspaceSlug);

  if (!template || !workspace) return null;
  return (
    <div className="flex items-center justify-between gap-4 p-3 border border-custom-border-200 rounded-lg bg-custom-background-90/60">
      <div className="flex flex-col w-full truncate">
        <div className="text-sm font-medium text-custom-text-100 truncate">{template.name}</div>
        {template.short_description && (
          <div className="text-xs font-medium text-custom-text-300 truncate">{template.short_description}</div>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {currentLevel === ETemplateLevel.PROJECT && !template.project && (
          <span className="text-xs text-custom-text-300">{t("templates.settings.template_source.workspace.info")}</span>
        )}
        {currentLevel === ETemplateLevel.WORKSPACE && template.project && (
          <span className="text-xs text-custom-text-300">{t("templates.settings.template_source.project.info")}</span>
        )}
        <Button
          variant="neutral-primary"
          className="rounded py-1 focus:bg-custom-background-100 focus:text-custom-text-200"
          size="sm"
          onClick={handleUseTemplateAction}
          disabled={!!selectedTemplateId}
        >
          {selectedTemplateId === templateId
            ? t("templates.settings.use_template.button.loading")
            : t("templates.settings.use_template.button.default")}
          {selectedTemplateId === templateId && <Spinner className="size-3 animate-spin" />}
        </Button>
        <TemplateQuickActions
          templateId={templateId}
          workspaceSlug={workspaceSlug}
          parentRef={parentRef}
          getTemplateById={getTemplateById}
          deleteTemplate={deleteTemplate}
        />
      </div>
    </div>
  );
});
