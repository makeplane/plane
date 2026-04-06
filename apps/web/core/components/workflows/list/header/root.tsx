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
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Input } from "@plane/propel/input";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  ExternalLinkIcon,
  SearchIcon,
  SortByDownIcon,
  SortByUpIcon,
} from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { Button } from "@plane/propel/button";
import { useTranslation } from "@plane/i18n";
import { WorkFlowListFilters } from "./filters";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { Menu } from "@plane/propel/menu";
import type { TWorkflowSortBy } from "@plane/types";
import { useIssueTypes } from "@/plane-web/hooks/store";

type Props = {
  handleCreateWorkflow: () => void;
  showControls: boolean;
  projectId: string;
  workspaceSlug: string;
};

export const WorkFlowListHeader = observer(function WorkFlowListHeader(props: Props) {
  // props
  const { handleCreateWorkflow, showControls, projectId, workspaceSlug } = props;
  // states
  const [isBannerDismissed, setBannerDismissed] = useState(false);
  // hooks
  const { t } = useTranslation();
  const { filters } = useWorkflows();
  const { isWorkItemTypeEnabledForProject } = useIssueTypes();
  const navigate = useNavigate();
  // derived values
  const sortOrder = filters.sortOrder;
  const sortBy = filters.sortBy;
  const isWorkItemTypeEnabled = isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
  const shouldShowWorkItemTypesBanner = !showControls && !isWorkItemTypeEnabled;

  useEffect(() => {
    if (!shouldShowWorkItemTypesBanner) {
      setBannerDismissed(false);
    }
  }, [shouldShowWorkItemTypesBanner]);

  const sortOptions: { id: TWorkflowSortBy; label: string }[] = [
    { id: "name", label: "Name" },
    { id: "created_at", label: "Date created" },
    { id: "updated_at", label: "Date modified" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <p className="text-body-md-medium">{t("project_settings.workflows.heading")}</p>
        {showControls && (
          <div className="flex items-center gap-3">
            <Input
              inputSize="xs"
              placeholder={t("project_settings.workflows.search")}
              value={filters.searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
              prependIcon={<SearchIcon className="size-4 text-tertiary" />}
            />

            <WorkFlowListFilters projectId={projectId} />
            <Menu
              customButton={
                <div className="relative">
                  {filters.isSortChanged && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-accent-primary rounded-full" />
                  )}

                  <IconButton
                    icon={sortOrder === "asc" ? SortByUpIcon : SortByDownIcon}
                    variant="secondary"
                    size="lg"
                  />
                </div>
              }
              optionsClassName="w-64"
            >
              {sortOptions.map((option) => (
                <Menu.MenuItem key={option.id} onClick={() => filters.setSortBy(option.id)}>
                  <div className="flex w-full items-center justify-between text-body-sm-regular">
                    <span>{option.label}</span>
                    {sortBy === option.id ? <CheckIcon className="size-4" /> : null}
                  </div>
                </Menu.MenuItem>
              ))}
              <div className="my-2 border-t border-subtle" />
              {(["asc", "desc"] as const).map((order) => (
                <Menu.MenuItem key={order} onClick={() => filters.setSortOrder(order)}>
                  <div className="flex w-full items-center justify-between text-body-sm-regular">
                    <span>{order === "asc" ? "Ascending" : "Descending"}</span>
                    {sortOrder === order ? <CheckIcon className="size-4" /> : null}
                  </div>
                </Menu.MenuItem>
              ))}
            </Menu>
            <Button size="lg" onClick={handleCreateWorkflow}>
              {t("project_settings.workflows.add_button")}
            </Button>
          </div>
        )}
      </div>

      {shouldShowWorkItemTypesBanner && !isBannerDismissed && (
        // TODO-@plane/propel/banner: update this with propel banner component once it is ready
        <div className="rounded-lg py-3 px-4 bg-warning-subtle shadow-raised-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertIcon className="size-4 text-warning-primary" />
            <span className="text-body-sm-medium text-warning-primary">
              Define <span className="font-semibold">Work Item Types</span> first to create a new workflow.
            </span>
          </div>
          <div className="flex item-center gap-2">
            <Button
              variant="secondary"
              appendIcon={<ExternalLinkIcon className="size-4" />}
              onClick={() => navigate(`/${workspaceSlug}/projects/${projectId}/settings/work-item-types`)}
            >
              Work item types settings
            </Button>
            <IconButton icon={CloseIcon} variant="ghost" onClick={() => setBannerDismissed(true)} />
          </div>
        </div>
      )}
    </div>
  );
});
