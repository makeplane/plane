"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// constant
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// i18n
import { useTranslation } from "@plane/i18n";
// types
import {
  EViewAccess,
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  IWorkspaceView,
  EIssueLayoutTypes,
} from "@plane/types";
// ui
import { Button, Input, TextArea } from "@plane/ui";
// components
import { getComputedDisplayFilters, getComputedDisplayProperties } from "@plane/utils";
import { AppliedFiltersList, DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues";
// helpers
// hooks
import { useLabel, useMember } from "@/hooks/store";
import { AccessController } from "@/plane-web/components/views/access-controller";

type Props = {
  handleFormSubmit: (values: Partial<IWorkspaceView>) => Promise<void>;
  handleClose: () => void;
  data?: IWorkspaceView;
  preLoadedData?: Partial<IWorkspaceView>;
};

const defaultValues: Partial<IWorkspaceView> = {
  name: "",
  description: "",
  access: EViewAccess.PUBLIC,
  display_properties: getComputedDisplayProperties(),
  display_filters: getComputedDisplayFilters({
    layout: EIssueLayoutTypes.SPREADSHEET,
    order_by: "-created_at",
  }),
};

export const WorkspaceViewForm: React.FC<Props> = observer((props) => {
  const { handleFormSubmit, handleClose, data, preLoadedData } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaceLabels } = useLabel();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
  } = useForm<IWorkspaceView>({
    defaultValues,
  });

  const handleCreateUpdateView = async (formData: Partial<IWorkspaceView>) => {
    await handleFormSubmit(formData);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
      ...data,
    });
  }, [data, preLoadedData, reset]);

  const selectedFilters: IIssueFilterOptions = watch("filters");

  // filters whose value not null or empty array
  let appliedFilters: IIssueFilterOptions | undefined = undefined;
  Object.entries(selectedFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    if (!appliedFilters) appliedFilters = {};
    appliedFilters[key as keyof IIssueFilterOptions] = value;
  });

  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    // To clear all filters of any particular filter key.
    if (!value) {
      setValue("filters", {
        ...selectedFilters,
        [key]: [],
      });
      return;
    }

    let newValues = selectedFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    setValue("filters", {
      ...selectedFilters,
      [key]: newValues,
    });
  };

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("filters", {});
  };

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5 p-5">
        <h3 className="text-xl font-medium text-custom-text-200">
          {data ? t("view.update.label") : t("view.create.label")}
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
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
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="name"
                  name="name"
                  type="name"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder={t("common.title")}
                  className="w-full text-base"
                />
              )}
            />
            <span className="text-xs text-red-500">{errors?.name?.message}</span>
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  id="description"
                  name="description"
                  value={value}
                  placeholder={t("common.description")}
                  onChange={onChange}
                  className="w-full text-base resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                />
              )}
            />
          </div>
          <div className="flex gap-2">
            <AccessController control={control} />
            {/* filters dropdown */}
            <Controller
              control={control}
              name="filters"
              render={({ field: { onChange, value: filters } }) => (
                <FiltersDropdown title={t("common.filters")}>
                  <FilterSelection
                    filters={filters ?? {}}
                    handleFiltersUpdate={(key, value) => {
                      const newValues = filters?.[key] ?? [];

                      if (Array.isArray(value)) {
                        value.forEach((val) => {
                          if (!newValues.includes(val)) newValues.push(val);
                        });
                      } else {
                        if (filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
                        else newValues.push(value);
                      }

                      onChange({
                        ...filters,
                        [key]: newValues,
                      });
                    }}
                    layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.spreadsheet}
                    labels={workspaceLabels ?? undefined}
                    memberIds={workspaceMemberIds ?? undefined}
                  />
                </FiltersDropdown>
              )}
            />

            {/* display filters dropdown */}
            <Controller
              control={control}
              name="display_filters"
              render={({ field: { onChange: onDisplayFiltersChange, value: displayFilters } }) => (
                <Controller
                  control={control}
                  name="display_properties"
                  render={({ field: { onChange: onDisplayPropertiesChange, value: displayProperties } }) => (
                    <FiltersDropdown title={t("common.display")}>
                      <DisplayFiltersSelection
                        layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.spreadsheet}
                        displayFilters={displayFilters ?? {}}
                        handleDisplayFiltersUpdate={(updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
                          onDisplayFiltersChange({
                            ...displayFilters,
                            ...updatedDisplayFilter,
                          });
                        }}
                        displayProperties={displayProperties ?? {}}
                        handleDisplayPropertiesUpdate={(updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
                          onDisplayPropertiesChange({
                            ...displayProperties,
                            ...updatedDisplayProperties,
                          });
                        }}
                      />
                    </FiltersDropdown>
                  )}
                />
              )}
            />
          </div>
          {selectedFilters && Object.keys(selectedFilters).length > 0 && (
            <div>
              <AppliedFiltersList
                appliedFilters={appliedFilters ?? {}}
                handleClearAllFilters={clearAllFilters}
                handleRemoveFilter={handleRemoveFilter}
                labels={workspaceLabels ?? undefined}
                states={undefined}
                alwaysAllowEditing
              />
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
          {data
            ? isSubmitting
              ? t("common.updating")
              : t("view.update.label")
            : isSubmitting
              ? t("common.creating")
              : t("view.create.label")}
        </Button>
      </div>
    </form>
  );
});
