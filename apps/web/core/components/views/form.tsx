import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ETabIndices, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { ViewsIcon } from "@plane/propel/icons";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IProjectView,
  EIssueLayoutTypes,
  IIssueFilters,
} from "@plane/types";
import { EViewAccess, EIssuesStoreType } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { getComputedDisplayFilters, getComputedDisplayProperties, getTabIndex } from "@plane/utils";
// components
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { AccessController } from "@/plane-web/components/views/access-controller";
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
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-secondary">{data ? t("view.update.label") : t("view.create.label")}</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2 w-full">
            <EmojiPicker
              iconType="lucide"
              isOpen={isOpen}
              handleToggle={(val: boolean) => setIsOpen(val)}
              className="flex items-center justify-center flex-shrink0"
              buttonClassName="flex items-center justify-center"
              label={
                <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-2">
                  <>
                    {logoValue?.in_use ? (
                      <Logo logo={logoValue} size={18} type="lucide" />
                    ) : (
                      <ViewsIcon className="h-4 w-4 text-tertiary" />
                    )}
                  </>
                </span>
              }
              // TODO: fix types
              onChange={(val: any) => {
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
                  required: t("form.title.required"),
                  maxLength: {
                    value: 255,
                    message: t("form.title.max_length", { length: 255 }),
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
                    placeholder={t("common.title")}
                    className="w-full text-14"
                    tabIndex={getIndex("name")}
                    autoFocus
                  />
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
                <TextArea
                  id="description"
                  name="description"
                  placeholder={t("common.description")}
                  className="w-full text-14 resize-none min-h-24"
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
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" size="lg" onClick={handleClose} tabIndex={getIndex("cancel")}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" tabIndex={getIndex("submit")} loading={isSubmitting}>
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
