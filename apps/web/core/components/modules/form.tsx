import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IModule } from "@plane/types";
// ui
import { Input, TextArea } from "@plane/ui";
import { getDate, renderFormattedPayloadDate, getTabIndex } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectDropdown } from "@/components/dropdowns/project/dropdown";
import { ModuleStatusSelect } from "@/components/modules";
// hooks
import { useUser } from "@/hooks/store/user/user-user";

type Props = {
  handleFormSubmit: (values: Partial<IModule>, dirtyFields: any) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
  data?: IModule;
  isMobile?: boolean;
};

const defaultValues: Partial<IModule> = {
  name: "",
  description: "",
  status: "backlog",
  lead_id: null,
  member_ids: [],
};

export function ModuleForm(props: Props) {
  const { handleFormSubmit, handleClose, status, projectId, setActiveProject, data, isMobile = false } = props;
  // store hooks
  const { projectsWithCreatePermissions } = useUser();
  // form info
  const {
    formState: { errors, isSubmitting, dirtyFields },
    handleSubmit,
    control,
    reset,
  } = useForm<IModule>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      status: data?.status || "backlog",
      lead_id: data?.lead_id || null,
      member_ids: data?.member_ids || [],
    },
  });

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_MODULE, isMobile);

  const { t } = useTranslation();

  const handleCreateUpdateModule = async (formData: Partial<IModule>) => {
    await handleFormSubmit(formData, dirtyFields);

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(handleCreateUpdateModule)}>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-x-3">
          {!status && (
            <Controller
              control={control}
              name="project_id"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <ProjectDropdown
                    value={value}
                    onChange={(val) => {
                      if (!Array.isArray(val)) {
                        onChange(val);
                        setActiveProject(val);
                      }
                    }}
                    multiple={false}
                    buttonVariant="border-with-text"
                    renderCondition={(projectId) => !!projectsWithCreatePermissions?.[projectId]}
                    tabIndex={getIndex("cover_image")}
                  />
                </div>
              )}
            />
          )}
          <h3 className="text-18 font-medium text-secondary">
            {status ? t("common.update") : t("common.create")} {t("common.module").toLowerCase()}
          </h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Controller
              control={control}
              name="name"
              rules={{
                required: t("title_is_required"),
                maxLength: {
                  value: 255,
                  message: t("title_should_be_less_than_255_characters"),
                },
              }}
              render={({ field: { value, onChange } }) => (
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors?.name)}
                  placeholder={t("title")}
                  className="w-full text-14"
                  tabIndex={getIndex("name")}
                  autoFocus
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
                  onChange={onChange}
                  placeholder={t("description")}
                  className="w-full text-14 resize-none min-h-24"
                  hasError={Boolean(errors?.description)}
                  tabIndex={getIndex("description")}
                />
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Controller
              control={control}
              name="start_date"
              render={({ field: { value: startDateValue, onChange: onChangeStartDate } }) => (
                <Controller
                  control={control}
                  name="target_date"
                  render={({ field: { value: endDateValue, onChange: onChangeEndDate } }) => (
                    <DateRangeDropdown
                      buttonVariant="border-with-text"
                      className="h-7"
                      value={{
                        from: getDate(startDateValue),
                        to: getDate(endDateValue),
                      }}
                      onSelect={(val) => {
                        onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                        onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                      }}
                      placeholder={{
                        from: t("start_date"),
                        to: t("end_date"),
                      }}
                      hideIcon={{
                        to: true,
                      }}
                      tabIndex={getIndex("date_range")}
                    />
                  )}
                />
              )}
            />
            <div className="h-7">
              <ModuleStatusSelect control={control} error={errors.status} tabIndex={getIndex("status")} />
            </div>
            <Controller
              control={control}
              name="lead_id"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple={false}
                    buttonVariant="border-with-text"
                    placeholder={t("lead")}
                    tabIndex={getIndex("lead")}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="member_ids"
              render={({ field: { value, onChange } }) => (
                <div className="h-7">
                  <MemberDropdown
                    value={value}
                    onChange={onChange}
                    projectId={projectId}
                    multiple
                    buttonVariant={value && value.length > 0 ? "transparent-without-text" : "border-with-text"}
                    buttonClassName={value && value.length > 0 ? "hover:bg-transparent px-0" : ""}
                    placeholder={t("members")}
                    tabIndex={getIndex("member_ids")}
                  />
                </div>
              )}
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle">
        <Button variant="secondary" size="lg" onClick={handleClose} tabIndex={getIndex("cancel")}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting} tabIndex={getIndex("submit")}>
          {status
            ? isSubmitting
              ? t("updating")
              : t("project_module.update_module")
            : isSubmitting
              ? t("creating")
              : t("project_module.create_module")}
        </Button>
      </div>
    </form>
  );
}
