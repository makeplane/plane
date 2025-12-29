import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IWorkspaceView, IIssueFilters } from "@plane/types";
import { EViewAccess, EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { getComputedDisplayFilters, getComputedDisplayProperties } from "@plane/utils";
// components
import { DisplayFiltersSelection, FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
// plane web imports
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { AccessController } from "@/plane-web/components/views/access-controller";

type Props = {
  handleFormSubmit: (values: Partial<IWorkspaceView>) => Promise<void>;
  handleClose: () => void;
  data?: IWorkspaceView;
  preLoadedData?: Partial<IWorkspaceView>;
  workspaceSlug: string;
};

const DEFAULT_VALUES: Partial<IWorkspaceView> = {
  name: "",
  description: "",
  access: EViewAccess.PUBLIC,
  display_properties: getComputedDisplayProperties(),
  display_filters: getComputedDisplayFilters({
    layout: EIssueLayoutTypes.SPREADSHEET,
    order_by: "-created_at",
  }),
};

export const WorkspaceViewForm = observer(function WorkspaceViewForm(props: Props) {
  const { handleFormSubmit, handleClose, data, preLoadedData, workspaceSlug } = props;
  // i18n
  const { t } = useTranslation();
  // form info
  const defaultValues = {
    ...DEFAULT_VALUES,
    ...preLoadedData,
    ...data,
  };
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
    getValues,
  } = useForm<IWorkspaceView>({
    defaultValues,
  });
  // derived values
  const workItemFilters: IIssueFilters = {
    richFilters: getValues("rich_filters"),
    displayFilters: getValues("display_filters"),
    displayProperties: getValues("display_properties"),
    kanbanFilters: undefined,
  };

  const handleCreateUpdateView = async (formData: Partial<IWorkspaceView>) => {
    await handleFormSubmit(formData);
    reset({
      ...defaultValues,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateView)}>
      <div className="space-y-5 p-5">
        <h3 className="text-18 font-medium text-secondary">{data ? t("view.update.label") : t("view.create.label")}</h3>
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
                  className="w-full text-14"
                />
              )}
            />
            <span className="text-11 text-danger-primary">{errors?.name?.message}</span>
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
                  className="w-full text-14 resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                />
              )}
            />
          </div>
          <div className="flex gap-2">
            <AccessController control={control} />
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
                        layoutDisplayFiltersOptions={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.layoutOptions.spreadsheet}
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
          <div>
            {/* filters dropdown */}
            <Controller
              control={control}
              name="rich_filters"
              render={({ field: { onChange: onFiltersChange } }) => (
                <WorkspaceLevelWorkItemFiltersHOC
                  entityId={data?.id}
                  entityType={EIssuesStoreType.GLOBAL}
                  filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.filters}
                  initialWorkItemFilters={workItemFilters}
                  isTemporary
                  updateFilters={(updateFilters) => onFiltersChange(updateFilters)}
                  showOnMount
                  workspaceSlug={workspaceSlug}
                >
                  {({ filter: workspaceViewWorkItemsFilter }) =>
                    workspaceViewWorkItemsFilter && (
                      <WorkItemFiltersRow filter={workspaceViewWorkItemsFilter} variant="modal" />
                    )
                  }
                </WorkspaceLevelWorkItemFiltersHOC>
              )}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
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
