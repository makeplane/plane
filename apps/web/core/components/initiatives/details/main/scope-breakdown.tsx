/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CircularProgressIndicator, ControlLink, Loader } from "@plane/ui";
import { getProgress } from "@plane/utils";
import { PlusIcon, ScopeIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
// plane web imports
import { SectionEmptyState } from "@/components/common/layout/main/common/empty-state";
import { SectionWrapper } from "@/components/common/layout/main/common/section-wrapper";
import { AddScopeButton } from "@/components/initiatives/common/add-scope-button";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeAnalyticData } from "@/types/initiative";

type TDataCardProps = {
  workspaceSlug: string;
  initiativeId: string;
  type: "project" | "epic";
  data: TInitiativeAnalyticData | undefined;
  onAdd: (value?: boolean) => void;
  count: number;
};

function DataCard(props: TDataCardProps) {
  const { type, data, workspaceSlug, initiativeId, count } = props;
  const router = useRouter();
  const total =
    (data?.backlog_issues ?? 0) +
    (data?.unstarted_issues ?? 0) +
    (data?.started_issues ?? 0) +
    (data?.completed_issues ?? 0) +
    (data?.cancelled_issues ?? 0);
  const progress = getProgress(data?.completed_issues, total, data?.cancelled_issues);

  const handleControlLinkClick = () => {
    router.push(`/${workspaceSlug}/initiatives/${initiativeId}/scope`);
  };
  return (
    <ControlLink
      href={`/${workspaceSlug}/initiatives/${initiativeId}/scope`}
      className="group rounded-md py-3 px-4 w-full hover:cursor-pointer hover:bg-layer-2-hover transition-colors flex justify-between border border-subtle bg-layer-2"
      onClick={handleControlLinkClick}
    >
      <div className="flex w-full justify-between text-tertiary flex-1 ">
        <div className="flex gap-2 items-center">
          <div className="font-medium text-14 capitalize">{type}s</div>
          <span className="text-tertiary text-11 font-medium">{count}</span>
        </div>
      </div>
      {data ? (
        <div className="rounded-md flex gap-3 justify-between items-center">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <CircularProgressIndicator percentage={progress} strokeWidth={4} size={18} />
              <span className="flex items-baseline text-13 justify-center">
                <span>{progress}%</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md flex gap-3 justify-between items-center">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 items-center">
              <Loader>
                <Loader.Item height="18px" width="18px" />
              </Loader>
              <Loader>
                <Loader.Item height="14px" width="40px" />
              </Loader>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Loader>
              <Loader.Item height="20px" width="120px" />
            </Loader>
          </div>
        </div>
      )}
    </ControlLink>
  );
}

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};
export const ScopeBreakdown = observer(function ScopeBreakdown(props: Props) {
  const { workspaceSlug, initiativeId, disabled } = props;
  const {
    initiative: {
      getInitiativeAnalyticsById,
      getInitiativeById,
      scope: {
        epics: { getInitiativeEpicsDetailById },
      },
      toggleProjectsModal,
      toggleEpicModal,
    },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const initiativeAnalytics = getInitiativeAnalyticsById(initiativeId);
  const initiative = getInitiativeById(initiativeId);

  const epicsCount = getInitiativeEpicsDetailById(initiativeId)?.length ?? initiative?.epic_ids?.length ?? 0;
  const projectsCount = initiative?.project_ids?.length ?? 0;

  const shouldShowProjectsCard = projectsCount > 0;
  const shouldShowEpicsCard = epicsCount > 0;

  if (!initiative) return null;

  return (
    <SectionWrapper className="flex-col gap-4 @container">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-14 font-medium text-tertiary">{t("initiatives.scope.breakdown")}</div>
        {/* button */}
        <div className="flex gap-2 items-center">
          <Link
            href={`/${workspaceSlug}/initiatives/${initiativeId}/scope`}
            className=" font-medium text-sm text-secondary"
          >
            {t("initiatives.scope.view_scope")}
          </Link>
          <AddScopeButton
            disabled={disabled}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            customButton={
              <Button variant="link" size="sm" className="p-1! hover:bg-layer-transparent-hover">
                <PlusIcon className="size-4" />
              </Button>
            }
          />
        </div>
      </div>
      {/* content */}
      {!shouldShowProjectsCard && !shouldShowEpicsCard ? (
        <SectionEmptyState
          heading={t("initiatives.scope.empty_state.title")}
          subHeading={t("initiatives.scope.empty_state.description")}
          icon={<ScopeIcon className="size-4" />}
          actionElement={
            <AddScopeButton disabled={disabled} workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
          }
        />
      ) : (
        <div className="grid w-full grid-cols-1 @sm:grid-cols-1 bg-layer-1 rounded-lg p-2 gap-2">
          {/* Projects */}
          {shouldShowProjectsCard && (
            <DataCard
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              type="project"
              onAdd={toggleProjectsModal}
              data={initiativeAnalytics?.project}
              count={projectsCount}
            />
          )}
          {/* Epics */}
          {shouldShowEpicsCard && (
            <DataCard
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              type="epic"
              onAdd={() => void toggleEpicModal(true, { workspaceSlug, initiativeId })}
              data={initiativeAnalytics?.epic}
              count={epicsCount}
            />
          )}
        </div>
      )}
    </SectionWrapper>
  );
});
