/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_MILESTONES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import { Collapsible, CollapsibleButton, Loader } from "@plane/ui";
// hooks
import { useMilestone } from "@/hooks/store/use-milestone";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { MilestoneListItem } from "./milestone-list-item";
import { CreateUpdateMilestoneModal } from "./modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const MilestonesSection = observer(function MilestonesSection(props: Props) {
  const { workspaceSlug, projectId } = props;
  // states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // store hooks
  const { getProjectById, openCollapsibleSection, toggleOpenCollapsibleSection } = useProject();
  const { getMilestonesByProjectId, getIsMilestonesFetchedForProject, fetchMilestones } = useMilestone();
  const { allowPermissions, getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const project = getProjectById(projectId);
  const projectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isMilestoneEnabled = Boolean(project?.is_milestone_enabled);
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  // fetch project milestones
  useSWR(
    isMilestoneEnabled ? PROJECT_MILESTONES(projectId, projectRole) : null,
    isMilestoneEnabled ? () => fetchMilestones(workspaceSlug, projectId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // derived values
  const milestones = getMilestonesByProjectId(projectId);
  const isFetched = getIsMilestonesFetchedForProject(projectId);
  const isCollapsibleOpen = openCollapsibleSection.includes("milestones");

  if (!isMilestoneEnabled) return null;

  return (
    <>
      <CreateUpdateMilestoneModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />
      <Collapsible
        isOpen={isCollapsibleOpen}
        onToggle={() => toggleOpenCollapsibleSection("milestones")}
        title={
          <CollapsibleButton
            isOpen={isCollapsibleOpen}
            title={t("milestones")}
            indicatorElement={
              <span className="flex items-center justify-center">
                <p className="text-14 !leading-3 text-tertiary">{milestones.length}</p>
              </span>
            }
          />
        }
        actionElement={
          isEditable && (
            <button
              type="button"
              className="flex items-center gap-1 rounded px-2 py-1 text-12 font-medium text-tertiary hover:bg-layer-transparent-hover hover:text-secondary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusIcon className="size-3.5" />
              {t("milestone_new")}
            </button>
          )
        }
        buttonClassName="w-full"
      >
        <div className="py-3">
          {!isFetched ? (
            <Loader className="space-y-3">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          ) : milestones.length === 0 ? (
            <p className="py-2 text-13 text-tertiary">{t("milestone_empty_state")}</p>
          ) : (
            <div className="space-y-2">
              {milestones.map((milestone) => (
                <MilestoneListItem
                  key={milestone.id}
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  milestoneId={milestone.id}
                  disabled={!isEditable}
                />
              ))}
            </div>
          )}
        </div>
      </Collapsible>
    </>
  );
});
