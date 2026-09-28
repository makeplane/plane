/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TextArea, TextAreaGroup } from "@makeplane/propel/components/text-area";
import { ETabIndices, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  DialogActions,
  DialogBody,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { EmojiPicker, Logo } from "@plane/blocks/emoji-icon-picker";
import { ViewsOutline } from "@makeplane/propel/icons";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IProjectView,
  EIssueLayoutTypes,
  IIssueFilters,
} from "@plane/types";
import { EViewAccess, EIssuesStoreType } from "@plane/types";
import { getComputedDisplayFilters, getComputedDisplayProperties, getTabIndex } from "@plane/utils";
// components
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { LayoutDropDown } from "../dropdowns/layout";
import { ProjectLevelWorkItemFiltersHOC } from "../work-item-filters/filters-hoc/project-level";

type Props = {
  data?: IProjectView | null;
  handleClose: () => void;
  handleFormSubmit: (values: IProjectView) => Promise<void>;
  preLoadedData?: Partial<IProjectView> | null;
  projectId: string;
  workspaceSlug: string;
};

const DEFAULT_VALUES: Partial<IProjectView> = {
  name: "",
  description: "",
  access: EViewAccess.PUBLIC,
  display_properties: getComputedDisplayProperties(),
  display_filters: { ...getComputedDisplayFilters(), group_by: "state" },
};

export const ProjectViewForm = observer(function ProjectViewForm(props: Props) {
  const { handleFormSubmit, handleClose, data, preLoadedData, projectId, workspaceSlug } = props;
  // i18n
  const { t } = useTranslation();
  // state
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  // form info
  const defaultValues = {
    ...DEFAULT_VALUES,
    ...preLoadedData,
    ...data,
  };
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<IProjectView>({
    defaultValues,
  });
  // derived values
  const projectDetails = getProjectById(projectId);
  const logoValue = watch("logo_props");
  const workItemFilters: IIssueFilters = {
    richFilters: getValues("rich_filters"),
    displayFilters: getValues("display_filters"),
    displayProperties: getValues("display_properties"),
    kanbanFilters: undefined,
  };
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_VIEW, isMobile);

  const handleCreateUpdateView = async (formData: IProjectView) => {
    await handleFormSubmit({
      name: formData.name,
      description: formData.description,
      logo_props: formData.logo_props,
      rich_filters: formData.rich_filters,
      display_filters: formData.display_filters,
      display_properties: formData.display_properties,
      access: formData.access,
    } as IProjectView);

    reset({
      ...defaultValues,
    });
  };

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(handleCreateUpdateView)}>
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{data ? t("view.update.label") : t("view.create.label")}</DialogTitle>
          </DialogHeading>
        </DialogHeader>
        <DialogBody tabIndex={0}>
          <div className="space-y-3">
            <div className="flex w-full items-start gap-2">
              <EmojiPicker
                iconType="lucide"
                isOpen={isOpen}
                handleToggle={(val: boolean) => setIsOpen(val)}
                className="flex-shrink0 flex items-center justify-center"
                buttonClassName="flex items-center justify-center"
                label={
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-2">
                    <>
                      {logoValue?.in_use ? (
                        <Logo logo={logoValue} size={18} type="lucide" />
                      ) : (
                        <ViewsOutline className="h-4 w-4 text-tertiary" />
                      )}
                    </>
                  </span>
                }
                // TODO: fix types
                onChange={(val: any) => {
                  // oxlint-disable-next-line no-shadow
                  let logoValue = {};

                  if (val?.type === "emoji")
                    logoValue = {
                      value: val.value,
                    };
                  else if (val?.type === "icon") logoValue = val.value;

                  setValue("logo_props", {
                    in_use: val?.type,
                    [val?.type]: logoValue,
                  });
                  setIsOpen(false);
                }}
                defaultIconColor={
                  logoValue?.in_use && logoValue?.in_use === "icon" ? logoValue?.icon?.color : undefined
                }
                defaultOpen={logoValue?.in_use && logoValue?.in_use === "emoji" ? "emoji" : "icon"}
              />
              <div className="flew-grow w-full space-y-1">
                <Controller
                  control={control}
                  name="name"
                  rules={{
                    required: t("form.title.required"),
                    maxLength: {
                      value: 255,
                      message: t("form.title.max_length", { length: 255 }),
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <Field name="name" invalid={Boolean(errors.name)}>
                      <InputGroup size="2xl">
                        <Input
                          size="2xl"
                          id="name"
                          type="name"
                          name="name"
                          value={value}
                          onChange={onChange}
                          placeholder={t("common.title")}
                          tabIndex={getIndex("name")}
                          // oxlint-disable-next-line jsx_a11y/no-autofocus
                          autoFocus
                        />
                      </InputGroup>
                    </Field>
                  )}
                />
                <span className="text-11 text-danger-primary">{errors?.name?.message?.toString()}</span>
              </div>
            </div>
            <div>
              <Controller
                name="description"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Field name="description" invalid={Boolean(errors?.description)}>
                    <TextAreaGroup resize="none">
                      <TextArea
                        size="lg"
                        surface="field"
                        autoResize
                        maxRows={8}
                        id="description"
                        name="description"
                        placeholder={t("common.description")}
                        value={value}
                        onChange={onChange}
                        tabIndex={getIndex("descriptions")}
                      />
                    </TextAreaGroup>
                  </Field>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="display_filters"
                render={({ field: { onChange: onDisplayFiltersChange, value: displayFilters } }) => (
                  <>
                    {/* layout dropdown */}
                    <LayoutDropDown
                      onChange={(selectedValue: EIssueLayoutTypes) =>
                        onDisplayFiltersChange({
                          ...displayFilters,
                          layout: selectedValue,
                        })
                      }
                      value={displayFilters.layout}
                    />
                    {/* display filters dropdown */}
                    <Controller
                      control={control}
                      name="display_properties"
                      render={({ field: { onChange: onDisplayPropertiesChange, value: displayProperties } }) => (
                        <FiltersDropdown title={t("common.display")}>
                          <DisplayFiltersSelection
                            layoutDisplayFiltersOptions={
                              ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[displayFilters.layout]
                            }
                            displayFilters={displayFilters ?? {}}
                            handleDisplayFiltersUpdate={(updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
                              onDisplayFiltersChange({
                                ...displayFilters,
                                ...updatedDisplayFilter,
                              });
                            }}
                            displayProperties={displayProperties ?? {}}
                            handleDisplayPropertiesUpdate={(
                              updatedDisplayProperties: Partial<IIssueDisplayProperties>
                            ) => {
                              onDisplayPropertiesChange({
                                ...displayProperties,
                                ...updatedDisplayProperties,
                              });
                            }}
                            cycleViewDisabled={!projectDetails?.cycle_view}
                            moduleViewDisabled={!projectDetails?.module_view}
                          />
                        </FiltersDropdown>
                      )}
                    />
                  </>
                )}
              />
            </div>
            <div>
              {/* filters dropdown */}
              <Controller
                control={control}
                name="rich_filters"
                render={({ field: { onChange: onFiltersChange } }) => (
                  <ProjectLevelWorkItemFiltersHOC
                    entityId={data?.id}
                    entityType={EIssuesStoreType.PROJECT_VIEW}
                    filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
                    initialWorkItemFilters={workItemFilters}
                    isTemporary
                    updateFilters={(updateFilters) => onFiltersChange(updateFilters)}
                    projectId={projectId}
                    showOnMount
                    workspaceSlug={workspaceSlug}
                  >
                    {({ filter: projectViewWorkItemsFilter }) =>
                      projectViewWorkItemsFilter && (
                        <WorkItemFiltersRow filter={projectViewWorkItemsFilter} variant="modal" />
                      )
                    }
                  </ProjectLevelWorkItemFiltersHOC>
                )}
              />
            </div>
          </div>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button
          variant="secondary"
          size="md"
          stretch="auto"
          label={t("common.cancel")}
          onClick={handleClose}
          tabIndex={getIndex("cancel")}
        />
        <Button
          variant="primary"
          size="md"
          stretch="auto"
          type="submit"
          label={
            data
              ? isSubmitting
                ? t("common.updating")
                : t("view.update.label")
              : isSubmitting
                ? t("common.creating")
                : t("view.create.label")
          }
          tabIndex={getIndex("submit")}
          loading={isSubmitting}
        />
      </DialogActions>
    </form>
  );
});
