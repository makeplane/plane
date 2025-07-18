import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { NETWORK_CHOICES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
import { CustomSelect } from "@plane/ui";
// components
import { DateRangeDropdown, MemberDropdown, PriorityDropdown } from "@/components/dropdowns";
import { ProjectNetworkIcon } from "@/components/project";
// helpers
import { renderFormattedPayloadDate, getDate } from "@plane/utils";
// plane web imports
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { TProject } from "@/plane-web/types/projects";
// local imports
import { StateDropdown } from "../dropdowns";
import MembersDropdown from "../dropdowns/members-dropdown";

type Props = {
  workspaceSlug: string;
  currentWorkspace: IWorkspace;
  isProjectGroupingEnabled: boolean;
  data?: Partial<TProject>;
};
const ProjectAttributes: React.FC<Props> = (props) => {
  const { workspaceSlug, currentWorkspace, isProjectGroupingEnabled, data } = props;
  // plane imports
  const { t } = useTranslation();
  // react-hook-form
  const { control } = useFormContext<TProject>();
  // store
  const { defaultState } = useWorkspaceProjectStates();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isProjectGroupingEnabled && (
        <Controller
          name="state_id"
          control={control}
          render={({ field: { onChange, value } }) => (
            <StateDropdown
              value={value || data?.state_id || defaultState || ""}
              onChange={onChange}
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={currentWorkspace.id}
              buttonClassName="h-7"
              disabled={false}
            />
          )}
        />
      )}
      <Controller
        name="network"
        control={control}
        render={({ field: { onChange, value } }) => {
          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);

          return (
            <div className="flex-shrink-0 h-7" tabIndex={4}>
              <CustomSelect
                value={value}
                onChange={onChange}
                label={
                  <div className="flex items-center gap-1 h-full">
                    {currentNetwork ? (
                      <>
                        <ProjectNetworkIcon iconKey={currentNetwork.iconKey} />
                        {t(currentNetwork.i18n_label)}
                      </>
                    ) : (
                      <span className="text-custom-text-400">Select network</span>
                    )}
                  </div>
                }
                placement="bottom-start"
                className="h-full"
                buttonClassName="h-full"
                noChevron
                tabIndex={4}
              >
                {NETWORK_CHOICES.map((network) => (
                  <CustomSelect.Option key={network.key} value={network.key}>
                    <div className="flex items-start gap-2">
                      <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{t(network.i18n_label)}</p>
                        <p className="text-xs text-custom-text-400">{t(network.description)}</p>
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          );
        }}
      />
      {isProjectGroupingEnabled && (
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
                  minDate={new Date()}
                  value={{
                    from: getDate(startDateValue),
                    to: getDate(endDateValue),
                  }}
                  onSelect={(val) => {
                    console.log({ val });
                    onChangeStartDate(val?.from ? renderFormattedPayloadDate(val.from) : null);
                    onChangeEndDate(val?.to ? renderFormattedPayloadDate(val.to) : null);
                  }}
                  placeholder={{
                    from: "Start date",
                    to: "End date",
                  }}
                  hideIcon={{
                    to: true,
                  }}
                  tabIndex={3}
                />
              )}
            />
          )}
        />
      )}
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="priority"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <PriorityDropdown
                value={value || data?.priority}
                onChange={(priority) => {
                  onChange(priority);
                }}
                buttonVariant="border-with-text"
              />
            </div>
          )}
        />
      )}
      <Controller
        name="project_lead"
        control={control}
        render={({ field: { value, onChange } }) => {
          if (value === undefined || value === null || typeof value === "string")
            return (
              <div className="flex-shrink-0 h-7" tabIndex={5}>
                <MemberDropdown
                  value={value ?? null}
                  onChange={(lead) => onChange(lead === value ? null : lead)}
                  placeholder="Lead"
                  multiple={false}
                  buttonVariant="border-with-text"
                  tabIndex={5}
                />
              </div>
            );
          else return <></>;
        }}
      />
      {isProjectGroupingEnabled && (
        <Controller
          control={control}
          name="members"
          render={({ field: { value, onChange } }) => (
            <MembersDropdown value={value as unknown as string[]} onChange={onChange} className="h-7" />
          )}
        />
      )}
    </div>
  );
};
export default ProjectAttributes;
