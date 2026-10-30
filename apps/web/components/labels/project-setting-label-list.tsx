/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, SETTINGS_DOCS_URLS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { SearchOutline } from "@makeplane/propel/icons";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import type { IIssueLabel } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
import type { TLabelOperationsCallbacks } from "@/components/labels";
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  ProjectSettingLabelGroup,
  ProjectSettingLabelItem,
} from "@/components/labels";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { SettingsHeading } from "../settings/heading";

export const ProjectSettingsLabelList = observer(function ProjectSettingsLabelList() {
  // router
  const { workspaceSlug, projectId } = useParams();
  // refs
  const scrollToRef = useRef<HTMLDivElement>(null);
  // states
  const [showLabelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabel | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { projectLabels, updateLabelPosition, projectLabelsTree, createLabel, updateLabel } = useLabel();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const labelOperationsCallbacks: TLabelOperationsCallbacks = {
    createLabel: (data: Partial<IIssueLabel>) => createLabel(workspaceSlug?.toString(), projectId?.toString(), data),
    updateLabel: (labelId: string, data: Partial<IIssueLabel>) =>
      updateLabel(workspaceSlug?.toString(), projectId?.toString(), labelId, data),
  };

  // a search flattens the tree into the labels whose own name matches
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchedLabels = useMemo(
    () =>
      trimmedQuery ? (projectLabels ?? []).filter((label) => label.name.toLowerCase().includes(trimmedQuery)) : [],
    [projectLabels, trimmedQuery]
  );

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const onDrop = (
    draggingLabelId: string,
    droppedParentId: string | null,
    droppedLabelId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    if (workspaceSlug && projectId) {
      updateLabelPosition(
        workspaceSlug?.toString(),
        projectId?.toString(),
        draggingLabelId,
        droppedParentId,
        droppedLabelId,
        dropAtEndOfList
      );
      return;
    }
  };

  return (
    <>
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />
      <SettingsHeading
        title={t("project_settings.labels.heading")}
        description={t("project_settings.labels.description")}
        docHref={SETTINGS_DOCS_URLS.labels}
      />
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-surface-1 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <InputField
            type="search"
            size="lg"
            orientation="vertical"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("common.search.label")}
            aria-label={t("common.search.label")}
            startIcon={<Icon icon={SearchOutline} tint="tertiary" />}
          />
        </div>
        {isEditable && (
          <Button variant="primary" size="md" stretch="auto" onClick={newLabel} label={t("common.add_label")} />
        )}
      </div>
      <div className="w-full">
        {showLabelForm && (
          <div className="my-2 w-full rounded-sm border border-subtle px-3.5 py-2">
            <CreateUpdateLabelInline
              labelForm={showLabelForm}
              setLabelForm={setLabelForm}
              isUpdating={isUpdating}
              labelOperationsCallbacks={labelOperationsCallbacks}
              ref={scrollToRef}
              onClose={() => {
                setLabelForm(false);
                setIsUpdating(false);
              }}
            />
          </div>
        )}
        {projectLabels ? (
          projectLabels.length === 0 && !showLabelForm ? (
            <EmptyStateCompact
              assetKey="label"
              assetClassName="size-20"
              title={t("settings_empty_state.labels.title")}
              description={t("settings_empty_state.labels.description")}
              actions={[
                {
                  label: t("settings_empty_state.labels.cta_primary"),
                  onClick: () => {
                    newLabel();
                  },
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          ) : trimmedQuery ? (
            searchedLabels.length === 0 ? (
              <p className="py-10 text-center text-body-sm-regular text-tertiary">
                {t("common.search.no_matches_found")}
              </p>
            ) : (
              <>
                {searchedLabels.map((label, index) => (
                  <ProjectSettingLabelItem
                    label={label}
                    key={label.id}
                    setIsUpdating={setIsUpdating}
                    handleLabelDelete={(labelToDelete) => setSelectDeleteLabel(labelToDelete)}
                    isChild={false}
                    isLastChild={index === searchedLabels.length - 1}
                    // reordering a filtered list has no stable position to drop into
                    onDrop={() => {}}
                    isEditable={isEditable}
                    labelOperationsCallbacks={labelOperationsCallbacks}
                  />
                ))}
              </>
            )
          ) : (
            projectLabelsTree?.map((label, index) => {
              if (label.children && label.children.length) {
                return (
                  <ProjectSettingLabelGroup
                    key={label.id}
                    label={label}
                    labelChildren={label.children || []}
                    handleLabelDelete={(label: IIssueLabel) => setSelectDeleteLabel(label)}
                    isUpdating={isUpdating}
                    setIsUpdating={setIsUpdating}
                    isLastChild={index === projectLabelsTree.length - 1}
                    onDrop={onDrop}
                    isEditable={isEditable}
                    labelOperationsCallbacks={labelOperationsCallbacks}
                  />
                );
              }
              return (
                <ProjectSettingLabelItem
                  label={label}
                  key={label.id}
                  setIsUpdating={setIsUpdating}
                  handleLabelDelete={(label) => setSelectDeleteLabel(label)}
                  isChild={false}
                  isLastChild={index === projectLabelsTree.length - 1}
                  onDrop={onDrop}
                  isEditable={isEditable}
                  labelOperationsCallbacks={labelOperationsCallbacks}
                />
              );
            })
          )
        ) : (
          !showLabelForm && (
            <Loader className="space-y-5">
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
              <Loader.Item height="42px" />
            </Loader>
          )
        )}
      </div>
    </>
  );
});
