import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ScopeIcon } from "@plane/propel/icons";
import { CircularProgressIndicator,ControlLink,Loader } from "@plane/ui";
// plane web imports
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common/empty-state";
import { SectionWrapper } from "@/plane-web/components/common/layout/main/common/section-wrapper";
import { AddScopeButton } from "@/plane-web/components/initiatives/common/add-scope-button";
import { UpdateStatusPills } from "@/plane-web/components/initiatives/common/update-status";
import { useInitiativeUpdates } from "@/plane-web/components/initiatives/details/sidebar/use-updates";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeAnalyticData } from "@/plane-web/types/initiative";

type TDataCardProps = {
  workspaceSlug: string;
  initiativeId: string;
  type: "project" | "epic";
  data: TInitiativeAnalyticData | undefined;
  onAdd: (value?: boolean) => void;
};

const DataCard = (props: TDataCardProps) => {
  const { type, data, workspaceSlug, initiativeId } = props;
  const router = useRouter();
  const { handleUpdateOperations } = useInitiativeUpdates(workspaceSlug, initiativeId);
  const total =
    (data?.backlog_issues ?? 0) +
    (data?.unstarted_issues ?? 0) +
    (data?.started_issues ?? 0) +
    (data?.completed_issues ?? 0) +
    (data?.cancelled_issues ?? 0);
  const completed = (data?.completed_issues ?? 0) + (data?.cancelled_issues ?? 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleControlLinkClick = () => {
    router.push(`/${workspaceSlug}/initiatives/${initiativeId}/scope`);
  };
  return (
    <ControlLink
      href={`/${workspaceSlug}/initiatives/${initiativeId}/scope`}
      className="group bg-custom-background-90 rounded-md p-3 w-full space-y-2 hover:cursor-pointer hover:bg-custom-background-80 transition-colors block"
      onClick={handleControlLinkClick}
    >
      <div className="flex w-full justify-between text-custom-text-300 ">
        <div className="font-semibold text-base capitalize">{type}s</div>
      </div>
      {data ? (
        <div className="border border-custom-border-100 bg-custom-background-100 rounded-md p-2 flex md:flex-row flex-col gap-2 justify-between w-full">
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-custom-text-350 font-medium text-sm">Progress</div>
            <div className="flex gap-2 items-center">
              <CircularProgressIndicator
                percentage={progress}
                strokeWidth={4}
                size={24}
                strokeColor="stroke-green-500"
              />
              <span className="flex items-baseline text-custom-text-200 justify-center">
                <span className="font-semibold">{progress}%</span>
              </span>
              <div className="text-custom-text-350 font-semibold text-sm">
                {completed}/{total}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="text-custom-text-350 font-medium text-sm">Updates</div>
            <div role="group" aria-label="update-status-pills">
              <UpdateStatusPills
                defaultTab={type}
                handleUpdateOperations={handleUpdateOperations}
                workspaceSlug={workspaceSlug.toString()}
                initiativeId={initiativeId}
                analytics={{
                  on_track_updates: data?.on_track_updates ?? 0,
                  at_risk_updates: data?.at_risk_updates ?? 0,
                  off_track_updates: data?.off_track_updates ?? 0,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <Loader className="w-full h-full">
          <Loader.Item height="71px" width="100%" />
        </Loader>
      )}
    </ControlLink>
  );
};

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  toggleProjectModal: (value?: boolean) => void;
  toggleEpicModal: (value?: boolean) => void;
  disabled?: boolean;
};
export const ScopeBreakdown = observer((props: Props) => {
  const { workspaceSlug, initiativeId, toggleProjectModal, toggleEpicModal, disabled } = props;
  const {
    initiative: {
      getInitiativeAnalyticsById,
      getInitiativeById,
      epics: { getInitiativeEpicsById },
    },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId);
  const initiative = getInitiativeById(initiativeId);
  const initiativeEpics = getInitiativeEpicsById(initiativeId);

  const epicsCount = initiativeEpics?.length ?? 0;
  const projectsCount = initiative?.project_ids?.length ?? 0;

  return (
    <SectionWrapper className="flex-col gap-4 @container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-custom-text-300 font-semibold text-base">{t("initiatives.scope.breakdown")}</div>
        {/* button */}
        <div className="flex gap-2">
          <Link
            href={`/${workspaceSlug}/initiatives/${initiativeId}/scope`}
            className="text-custom-primary-100 font-medium text-sm"
          >
            {t("initiatives.scope.view_scope")}
          </Link>
          <AddScopeButton
            disabled={disabled}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            customButton={<PlusIcon className="size-4" />}
          />
        </div>
      </div>
      {/* content */}
      {projectsCount === 0 && epicsCount === 0 ? (
        <SectionEmptyState
          heading={t("initiatives.scope.empty_state.title")}
          subHeading={t("initiatives.scope.empty_state.description")}
          icon={<ScopeIcon className="size-4" />}
          actionElement={
            <AddScopeButton disabled={disabled} workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
          }
        />
      ) : (
        <div className="grid gap-4 w-full grid-cols-1 @sm:grid-cols-1 @md:grid-cols-2">
          {/* Projects */}
          <DataCard
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            type="project"
            onAdd={toggleProjectModal}
            data={initiativeAnalytics?.project}
          />
          {/* Epics */}
          <DataCard
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            type="epic"
            onAdd={toggleEpicModal}
            data={initiativeAnalytics?.epic}
          />
        </div>
      )}
    </SectionWrapper>
  );
});
