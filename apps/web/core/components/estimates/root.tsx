import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { UpdateEstimateModal } from "@/plane-web/components/estimates";
// local imports
import { CreateEstimateModal } from "./create/modal";
import { DeleteEstimateModal } from "./delete/modal";
import { EstimateDisableSwitch } from "./estimate-disable-switch";
import { EstimateList } from "./estimate-list";
import { EstimateLoaderScreen } from "./loader-screen";

type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateRoot = observer(function EstimateRoot(props: TEstimateRoot) {
  const { workspaceSlug, projectId, isAdmin } = props;
  // hooks
  const { currentProjectDetails } = useProject();
  const { loader, currentActiveEstimateId, archivedEstimateIds, getProjectEstimates } = useProjectEstimates();
  // states
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  const [estimateToUpdate, setEstimateToUpdate] = useState<string | undefined>();
  const [estimateToDelete, setEstimateToDelete] = useState<string | undefined>();

  const { t } = useTranslation();

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getProjectEstimates(workspaceSlug, projectId)
  );

  if (loader === "init-loader" || isSWRLoading) {
    return <EstimateLoaderScreen />;
  }

  return (
    <>
      <div>
        {/* header */}
        <SettingsHeading
          title={t("project_settings.estimates.heading")}
          description={t("project_settings.estimates.description")}
        />
        <div className="mt-6">
          {/* current active estimate section */}
          {currentActiveEstimateId ? (
            <>
              {/* estimates activated deactivated section */}
              <SettingsBoxedControlItem
                title={t("project_settings.estimates.title")}
                description={t("project_settings.estimates.enable_description")}
                control={
                  <EstimateDisableSwitch workspaceSlug={workspaceSlug} projectId={projectId} isAdmin={isAdmin} />
                }
              />
              {/* active estimates section */}
              <div className="mt-12 flex flex-col gap-y-4">
                <SettingsHeading title="Estimates list" variant="h6" />
                <EstimateList
                  estimateIds={[currentActiveEstimateId]}
                  isAdmin={isAdmin}
                  isEstimateEnabled={Boolean(currentProjectDetails?.estimate)}
                  isEditable
                  onEditClick={(estimateId: string) => setEstimateToUpdate(estimateId)}
                  onDeleteClick={(estimateId: string) => setEstimateToDelete(estimateId)}
                />
              </div>
            </>
          ) : (
            <EmptyStateCompact
              assetKey="estimate"
              assetClassName="size-20"
              title={t("settings_empty_state.estimates.title")}
              description={t("settings_empty_state.estimates.description")}
              actions={[
                {
                  label: t("settings_empty_state.estimates.cta_primary"),
                  onClick: () => setIsEstimateCreateModalOpen(true),
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          )}
          {/* archived estimates section */}
          {archivedEstimateIds && archivedEstimateIds.length > 0 && (
            <div className="mt-12 flex flex-col gap-y-4">
              <SettingsHeading
                title="Archived estimates"
                description={
                  <>
                    Estimates have gone through a change, these are the estimates you had in your older versions which
                    were not in use. Read more about them&nbsp;
                    <a
                      href={"https://docs.plane.so/core-concepts/projects/run-project#estimate"}
                      target="_blank"
                      className="text-accent-primary/80 hover:text-accent-primary"
                      rel="noreferrer"
                    >
                      here.
                    </a>
                  </>
                }
                variant="h6"
              />
              <EstimateList estimateIds={archivedEstimateIds} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      </div>
      {/* CRUD modals */}
      <CreateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isEstimateCreateModalOpen}
        handleClose={() => setIsEstimateCreateModalOpen(false)}
      />
      <UpdateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToUpdate ? estimateToUpdate : undefined}
        isOpen={estimateToUpdate ? true : false}
        handleClose={() => setEstimateToUpdate(undefined)}
      />
      <DeleteEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToDelete ? estimateToDelete : undefined}
        isOpen={estimateToDelete ? true : false}
        handleClose={() => setEstimateToDelete(undefined)}
      />
    </>
  );
});
