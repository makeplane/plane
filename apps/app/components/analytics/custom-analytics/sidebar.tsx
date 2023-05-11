import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Control, Controller, UseFormSetValue } from "react-hook-form";
// services
import analyticsService from "services/analytics.service";
// hooks
import useProjects from "hooks/use-projects";
import useToast from "hooks/use-toast";
// ui
import { CustomMenu, CustomSelect, PrimaryButton } from "components/ui";
// icons
import { ArrowPathIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline";
// types
import { IAnalyticsParams, IAnalyticsResponse, IExportAnalyticsFormData } from "types";
// fetch-keys
import { ANALYTICS } from "constants/fetch-keys";
// constants
import { ANALYTICS_X_AXIS_VALUES, ANALYTICS_Y_AXIS_VALUES } from "constants/analytics";

type Props = {
  analytics: IAnalyticsResponse | undefined;
  params: IAnalyticsParams;
  control: Control<IAnalyticsParams, any>;
  setValue: UseFormSetValue<IAnalyticsParams>;
  setSaveAnalyticsModal: React.Dispatch<React.SetStateAction<boolean>>;
  fullScreen: boolean;
  isProjectLevel?: boolean;
};

export const AnalyticsSidebar: React.FC<Props> = ({
  analytics,
  params,
  control,
  setValue,
  setSaveAnalyticsModal,
  fullScreen,
  isProjectLevel = false,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { projects } = useProjects();

  const { setToastAlert } = useToast();

  const exportAnalytics = () => {
    if (!workspaceSlug) return;

    const data: IExportAnalyticsFormData = {
      x_axis: params.x_axis,
      y_axis: params.y_axis,
    };

    if (params.segment) data.segment = params.segment;
    if (params.project) data.project = [params.project];

    analyticsService
      .exportAnalytics(workspaceSlug.toString(), data)
      .then((res) =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: res.message,
        })
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "There was some error in exporting the analytics. Please try again.",
        })
      );
  };

  return (
    <div
      className={`gap-4 p-5 ${
        fullScreen ? "border-l border-brand-base bg-brand-sidebar h-full" : ""
      }`}
    >
      <div className={`sticky top-5 ${fullScreen ? "space-y-4" : "space-y-2"}`}>
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <h5 className="text-lg font-medium">
            {analytics?.total ?? 0}{" "}
            <span className="text-xs font-normal text-brand-secondary">issues</span>
          </h5>
          <CustomMenu ellipsis>
            <CustomMenu.MenuItem
              onClick={() => {
                if (!workspaceSlug) return;

                mutate(ANALYTICS(workspaceSlug.toString(), params));
              }}
            >
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-3 w-3" />
                Refresh
              </div>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={exportAnalytics}>
              <div className="flex items-center gap-2">
                <ArrowUpTrayIcon className="h-3 w-3" />
                Export analytics as CSV
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
        <div className={`${fullScreen ? "space-y-4" : "grid items-center gap-4 grid-cols-3"}`}>
          {isProjectLevel === false && (
            <div>
              <h6 className="text-xs text-brand-secondary">Project</h6>
              <Controller
                name="project"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <CustomSelect
                    value={value}
                    label={projects.find((p) => p.id === value)?.name ?? "All projects"}
                    onChange={onChange}
                    width="w-full"
                    maxHeight="lg"
                  >
                    <CustomSelect.Option value={null}>All projects</CustomSelect.Option>
                    {projects.map((project) => (
                      <CustomSelect.Option key={project.id} value={project.id}>
                        {project.name}
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                )}
              />
            </div>
          )}
          <div>
            <h6 className="text-xs text-brand-secondary">Measure (y-axis)</h6>
            <Controller
              name="y_axis"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  label={
                    <span>
                      {ANALYTICS_Y_AXIS_VALUES.find((v) => v.value === value)?.label ?? "None"}
                    </span>
                  }
                  onChange={onChange}
                  width="w-full"
                >
                  {ANALYTICS_Y_AXIS_VALUES.map((item) => (
                    <CustomSelect.Option key={item.value} value={item.value}>
                      {item.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          </div>
          <div>
            <h6 className="text-xs text-brand-secondary">Dimension (x-axis)</h6>
            <Controller
              name="x_axis"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  label={
                    <span>{ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label}</span>
                  }
                  onChange={(val: string) => {
                    if (params.segment === val) setValue("segment", null);

                    onChange(val);
                  }}
                  width="w-full"
                  maxHeight="lg"
                >
                  {ANALYTICS_X_AXIS_VALUES.map((item) => (
                    <CustomSelect.Option key={item.value} value={item.value}>
                      {item.label}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          </div>
          <div>
            <h6 className="text-xs text-brand-secondary">Segment</h6>
            <Controller
              name="segment"
              control={control}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  label={
                    <span>
                      {ANALYTICS_X_AXIS_VALUES.find((v) => v.value === value)?.label ?? (
                        <span className="text-brand-secondary">No value</span>
                      )}
                    </span>
                  }
                  onChange={onChange}
                  width="w-full"
                  maxHeight="lg"
                >
                  <CustomSelect.Option value={null}>No value</CustomSelect.Option>
                  {ANALYTICS_X_AXIS_VALUES.map((item) => {
                    if (params.x_axis === item.value) return null;

                    return (
                      <CustomSelect.Option key={item.value} value={item.value}>
                        {item.label}
                      </CustomSelect.Option>
                    );
                  })}
                </CustomSelect>
              )}
            />
          </div>
        </div>
        {/* <div className="flex items-center justify-end gap-2">
          <PrimaryButton className="py-1" onClick={() => setSaveAnalyticsModal(true)}>
            Save analytics
          </PrimaryButton>
        </div> */}
      </div>
    </div>
  );
};
