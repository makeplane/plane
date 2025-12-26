import { observer } from "mobx-react";
import { Link as Loader } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, EditIcon, TrashIcon, CloseIcon, ChevronRightIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { EIssueServiceType, EIssuesStoreType } from "@plane/types";
import { ControlLink, CustomMenu } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// helpers
import { useSubIssueOperations } from "@/components/issues/issue-detail-widgets/sub-issues/helper";
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local components
import { SubIssuesListItemProperties } from "./properties";
import { SubIssuesListRoot } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  rootIssueId: string;
  spacingLeft: number;
  canEdit: boolean;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  issueId: string;
  issueServiceType?: TIssueServiceType;
  storeType?: EIssuesStoreType;
};

export const SubIssuesListItem = observer(function SubIssuesListItem(props: Props) {
  const {
    workspaceSlug,
    projectId,
    parentIssueId,
    rootIssueId,
    issueId,
    spacingLeft = 10,
    canEdit,
    handleIssueCrudState,
    subIssueOperations,
    issueServiceType = EIssueServiceType.ISSUES,
    storeType = EIssuesStoreType.PROJECT,
  } = props;
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
    subIssues: {
      filters: { getSubIssueFilters },
    },
  } = useIssueDetail(issueServiceType);
  const {
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
  } = useIssueDetail();
  const { fetchSubIssues } = useSubIssueOperations(EIssueServiceType.ISSUES);
  const { toggleCreateIssueModal, toggleDeleteIssueModal } = useIssueDetail(issueServiceType);
  const project = useProject();
  const { handleRedirection } = useIssuePeekOverviewRedirection();
  const { isMobile } = usePlatformOS();
  const issue = getIssueById(issueId);

  // derived values
  const projectDetail = (issue && issue.project_id && project.getProjectById(issue.project_id)) || undefined;

  const subIssueHelpers = subIssueHelpersByIssueId(parentIssueId);
  const subIssueCount = issue?.sub_issues_count ?? 0;

  // derived values
  const subIssueFilters = getSubIssueFilters(parentIssueId);
  const displayProperties = subIssueFilters?.displayProperties ?? {};

  //
  const handleIssuePeekOverview = (issue: TIssue) => handleRedirection(workspaceSlug, issue, isMobile);

  if (!issue) return <></>;

  // check if current issue is the root issue
  const isCurrentIssueRoot = issueId === rootIssueId;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetail?.identifier,
    sequenceId: issue?.sequence_id,
  });

  return (
    <div key={issueId}>
      <ControlLink
        id={`issue-${issue.id}`}
        href={workItemLink}
        onClick={() => handleIssuePeekOverview(issue)}
        className="w-full cursor-pointer"
      >
        {issue && (
          <div
            className="group relative flex min-h-11 h-full w-full items-center pr-2 py-1 transition-all hover:bg-surface-2"
            style={{ paddingLeft: `${spacingLeft}px` }}
          >
            <div className="flex size-5 items-center justify-center flex-shrink-0">
              {/* disable the chevron when current issue is also the root issue*/}
              {subIssueCount > 0 && !isCurrentIssueRoot && (
                <>
                  {subIssueHelpers.preview_loader.includes(issue.id) ? (
                    <div className="flex h-full w-full cursor-not-allowed items-center justify-center rounded-xs bg-layer-1 transition-all">
                      <Loader width={14} strokeWidth={2} className="animate-spin" />
                    </div>
                  ) : (
                    <div
                      className="flex h-full w-full cursor-pointer items-center justify-center text-placeholder hover:text-tertiary"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!subIssueHelpers.issue_visibility.includes(issueId)) {
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                          await fetchSubIssues(workspaceSlug, projectId, issueId);
                          setSubIssueHelpers(parentIssueId, "preview_loader", issueId);
                        }
                        setSubIssueHelpers(parentIssueId, "issue_visibility", issueId);
                      }}
                    >
                      <ChevronRightIcon
                        className={cn("size-3.5 transition-all", {
                          "rotate-90": subIssueHelpers.issue_visibility.includes(issue.id),
                        })}
                        strokeWidth={2.5}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex w-full truncate cursor-pointer items-center gap-3">
              <WithDisplayPropertiesHOC displayProperties={displayProperties || {}} displayPropertyKey="key">
                <div className="flex-shrink-0">
                  {projectDetail && (
                    <IssueIdentifier
                      projectId={projectDetail.id}
                      issueTypeId={issue.type_id}
                      projectIdentifier={projectDetail.identifier}
                      issueSequenceId={issue.sequence_id}
                      size="xs"
                      variant="secondary"
                    />
                  )}
                </div>
              </WithDisplayPropertiesHOC>
              <Tooltip tooltipContent={issue.name} isMobile={isMobile}>
                <span className="flex-1 w-0 truncate text-13 text-primary">{issue.name}</span>
              </Tooltip>
            </div>

            <div
              className="flex-shrink-0 text-13"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <SubIssuesListItemProperties
                workspaceSlug={workspaceSlug}
                parentIssueId={parentIssueId}
                issueId={issueId}
                canEdit={canEdit}
                updateSubIssue={subIssueOperations.updateSubIssue}
                displayProperties={displayProperties}
                issue={issue}
              />
            </div>

            <div className="flex-shrink-0 text-13">
              <CustomMenu placement="bottom-end" ellipsis>
                {canEdit && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("update", parentIssueId, { ...issue });
                      toggleCreateIssueModal(true);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <EditIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("issue.edit")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}

                <CustomMenu.MenuItem
                  onClick={() => {
                    subIssueOperations.copyLink(workItemLink);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={2} />
                    <span>{t("issue.copy_link")}</span>
                  </div>
                </CustomMenu.MenuItem>

                {canEdit && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      if (issue.project_id)
                        subIssueOperations.removeSubIssue(workspaceSlug, issue.project_id, parentIssueId, issue.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CloseIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      {issueServiceType === EIssueServiceType.ISSUES
                        ? t("issue.remove.parent.label")
                        : t("issue.remove.label")}
                    </div>
                  </CustomMenu.MenuItem>
                )}

                {canEdit && (
                  <CustomMenu.MenuItem
                    onClick={() => {
                      handleIssueCrudState("delete", parentIssueId, issue);
                      toggleDeleteIssueModal(issue.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <TrashIcon className="h-3.5 w-3.5" strokeWidth={2} />
                      <span>{t("issue.delete.label")}</span>
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            </div>
          </div>
        )}
      </ControlLink>

      {/* should not expand the current issue if it is also the root issue*/}
      {subIssueHelpers.issue_visibility.includes(issueId) &&
        issue.project_id &&
        subIssueCount > 0 &&
        !isCurrentIssueRoot && (
          <SubIssuesListRoot
            storeType={storeType}
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            parentIssueId={issue.id}
            rootIssueId={rootIssueId}
            spacingLeft={spacingLeft + 22}
            canEdit={canEdit}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
          />
        )}
    </div>
  );
});
