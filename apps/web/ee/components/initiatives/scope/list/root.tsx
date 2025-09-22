import { observer } from "mobx-react";
import { Briefcase } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EpicIcon } from "@plane/propel/icons";
import { Button, Collapsible } from "@plane/ui";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { AddScopeButton } from "@/plane-web/components/initiatives/common/add-scope-button";
import { EpicListItem } from "@/plane-web/components/initiatives/details/main/collapsible-section/epics/epic-list-item/root";
import { ProjectList } from "@/plane-web/components/initiatives/details/main/collapsible-section/projects/project-list";
import { ListHeader } from "./header";

type Props = {
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};

export const InitiativeScopeListView = observer((props: Props) => {
  const { epicIds, projectIds, workspaceSlug, initiativeId, disabled, handleAddEpic, handleAddProject } = props;

  const { t } = useTranslation();

  const isEmpty = epicIds.length === 0 && projectIds.length === 0;

  const resolvedAssetPath = useResolvedAssetPath({ basePath: "/empty-state/initiatives/scope/initiatives-list" });

  if (isEmpty)
    return (
      <DetailedEmptyState
        assetPath={resolvedAssetPath}
        title={t("initiatives.scope.empty_state.title")}
        description={t("initiatives.scope.empty_state.description")}
        customPrimaryButton={
          <AddScopeButton
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            customButton={<Button>{t("initiatives.scope.empty_state.primary_button.text")}</Button>}
          />
        }
      />
    );

  return (
    <div className="h-full w-full overflow-y-auto">
      {/**Epics List */}
      {epicIds.length > 0 && (
        <Collapsible
          title={
            <ListHeader
              count={epicIds.length}
              label={t("common.epics")}
              handleAdd={handleAddEpic}
              icon={<EpicIcon className="size-4" />}
            />
          }
          buttonClassName="w-full"
          defaultOpen
        >
          {epicIds?.map((epicId) => (
            <EpicListItem
              key={epicId}
              workspaceSlug={workspaceSlug}
              epicId={epicId}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          ))}
        </Collapsible>
      )}
      {/**Projects List */}
      {projectIds.length > 0 && (
        <Collapsible
          title={
            <ListHeader
              count={projectIds.length}
              label={t("common.projects")}
              handleAdd={handleAddProject}
              icon={<Briefcase className="size-4" />}
            />
          }
          buttonClassName="w-full"
          defaultOpen
        >
          <ProjectList
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            projectIds={projectIds}
            disabled={disabled}
          />
        </Collapsible>
      )}
    </div>
  );
});
