"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Layers } from "lucide-react";
// types
import { IProjectView, IIssueFilterOptions, IIssueDisplayProperties, IIssueDisplayFilterOptions } from "@plane/types";
// ui
import { Button, EmojiIconPicker, EmojiIconPickerTypes, Input, TextArea } from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { AppliedFiltersList, DisplayFiltersSelection, FilterSelection, FiltersDropdown } from "@/components/issues";
// constants
import { EIssueLayoutTypes, ISSUE_DISPLAY_FILTERS_BY_LAYOUT } from "@/constants/issue";
import { ETabIndices } from "@/constants/tab-indices";
import { EViewAccess } from "@/constants/views";
// helpers
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getComputedDisplayFilters, getComputedDisplayProperties } from "@/helpers/issue.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { useLabel, useMember, useProject, useProjectState } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

import { AccessController } from "@/plane-web/components/views/access-controller";
import { LayoutDropDown } from "../dropdowns/layout";

type Props = {
  data?: IProjectView | null;
  handleClose: () => void;
  handleFormSubmit: (values: IProjectView) => Promise<void>;
  preLoadedData?: Partial<IProjectView> | null;
};

const defaultValues: Partial<IProjectView> = {
  name: "",
  description: "",
  access: EViewAccess.PUBLIC,
  display_properties: getComputedDisplayProperties(),
  display_filters: { ...getComputedDisplayFilters(), group_by: "state" },
};

export const ProjectViewForm: React.FC<Props> = observer((props) => {
  const { handleFormSubmit, handleClose, data, preLoadedData } = props;
  // state
  const [isOpen, setIsOpen] = useState(false);
  // store hooks
  const { currentProjectDetails } = useProject();
  const { projectStates } = useProjectState();
  const { projectLabels } = useLabel();
  const {
    project: { projectMemberIds },
  } = useMember();
  const { isMobile } = usePlatformOS();
  // form info
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<IProjectView>({
    defaultValues,
  });

  const logoValue = watch("logo_props");

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_VIEW, isMobile);

  const selectedFilters: IIssueFilterOptions = {};
  Object.entries(watch("filters") ?? {}).forEach(([key, value]) => {
    if (!value) return;

    if (Array.isArray(value) && value.length === 0) return;

    selectedFilters[key as keyof IIssueFilterOptions] = value;
  });

  // for removing filters from a key
  const handleRemoveFilter = (key: keyof IIssueFilterOptions, value: string | null) => {
    // If value is null then remove all the filters of that key
    if (!value) {
      setValue("filters", {
        ...selectedFilters,
        [key]: null,
      });
      return;
    }

    const newValues = selectedFilters?.[key] ?? [];

    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (newValues.includes(val)) newValues.splice(newValues.indexOf(val), 1);
      });
    } else {
      if (selectedFilters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
    }

    setValue("filters", {
      ...selectedFilters,
      [key]: newValues,
    });
  };

  const handleCreateUpdateView = async (formData: IProjectView) => {
    await handleFormSubmit({
      name: formData.name,
      description: formData.description,
      logo_props: formData.logo_props,
      filters: formData.filters,
      display_filters: formData.display_filters,
      display_properties: formData.display_properties,
      access: formData.access,
    } as IProjectView);

    reset({
      ...defaultValues,
    });
  };

  const clearAllFilters = () => {
    if (!selectedFilters) return;

    setValue("filters", {});
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
      ...data,
    });
  }, [data, preLoadedData, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5 p-5">
        <h3 className="text-xl font-medium text-custom-text-200">{data ? "Update" : "Create"} view</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 w-full">
            <EmojiIconPicker
              isOpen={isOpen}
              handleToggle={(val: boolean) => setIsOpen(val)}
              className="flex items-center justify-center flex-shrink0"
              buttonClassName="flex items-center justify-center"
              label={
                <span className="grid h-9 w-9 place-items-center rounded-md bg-custom-background-90">
                  <>
                    {logoValue?.in_use ? (
                      <Logo logo={logoValue} size={18} type="lucide" />
                    ) : (
                      <Layers className="h-4 w-4 text-custom-text-300" />
                    )}
                  </>
                </span>
              }
              onChange={(val: any) => {
                let logoValue = {};

                if (val?.type === "emoji")
                  logoValue = {
                    value: convertHexEmojiToDecimal(val.value.unified),
                    url: val.value.imageUrl,
                  };
                else if (val?.type === "icon") logoValue = val.value;

                setValue("logo_props", {
                  in_use: val?.type,
                  [val?.type]: logoValue,
                });
                setIsOpen(false);
              }}
              defaultIconColor={logoValue?.in_use && logoValue?.in_use === "icon" ? logoValue?.icon?.color : undefined}
              defaultOpen={
                logoValue?.in_use && logoValue?.in_use === "emoji"
                  ? EmojiIconPickerTypes.EMOJI
                  : EmojiIconPickerTypes.ICON
              }
            />
            <div className="space-y-1 flew-grow w-full">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: "Title is required",
                  maxLength: {
                    value: 255,
                    message: "Title should be less than 255 characters",
                  },
                }}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="name"
                    type="name"
                    name="name"
                    value={value}
                    onChange={onChange}
                    hasError={Boolean(errors.name)}
                    placeholder="Title"
                    className="w-full text-base"
                    tabIndex={getIndex("name")}
                    autoFocus
                  />
                )}
              />
              <span className="text-xs text-red-500">{errors?.name?.message?.toString()}</span>
            </div>
          </div>
          <div>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  id="description"
                  name="description"
                  placeholder="Description"
                  className="w-full text-base resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                  value={value}
                  onChange={onChange}
                  tabIndex={getIndex("descriptions")}
                />
              )}
            />
          </div>
          <div className="flex gap-2">
            <AccessController control={control} />
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

                  {/* filters dropdown */}
                  <Controller
                    control={control}
                    name="filters"
                    render={({ field: { onChange, value: filters } }) => (
                      <FiltersDropdown title="Filters" tabIndex={getIndex("filters")}>
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
                          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[displayFilters.layout]}
                          labels={projectLabels ?? undefined}
                          memberIds={projectMemberIds ?? undefined}
                          states={projectStates}
                          cycleViewDisabled={!currentProjectDetails?.cycle_view}
                          moduleViewDisabled={!currentProjectDetails?.module_view}
                        />
                      </FiltersDropdown>
                    )}
                  />

                  {/* display filters dropdown */}
                  <Controller
                    control={control}
                    name="display_properties"
                    render={({ field: { onChange: onDisplayPropertiesChange, value: displayProperties } }) => (
                      <FiltersDropdown title="Display">
                        <DisplayFiltersSelection
                          layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_LAYOUT.issues[displayFilters.layout]}
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
                          cycleViewDisabled={!currentProjectDetails?.cycle_view}
                          moduleViewDisabled={!currentProjectDetails?.module_view}
                        />
                      </FiltersDropdown>
                    )}
                  />
                </>
              )}
            />
          </div>
          {selectedFilters && Object.keys(selectedFilters).length > 0 && (
            <div>
              <AppliedFiltersList
                appliedFilters={selectedFilters}
                handleClearAllFilters={clearAllFilters}
                handleRemoveFilter={handleRemoveFilter}
                labels={projectLabels ?? []}
                states={projectStates}
              />
            </div>
          )}
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={getIndex("cancel")}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" tabIndex={getIndex("submit")} loading={isSubmitting}>
          {data ? (isSubmitting ? "Updating" : "Update View") : isSubmitting ? "Creating" : "Create View"}
        </Button>
      </div>
    </form>
  );
});
