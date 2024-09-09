"use client";
import { FC } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { IProject } from "@plane/types";
// ui
import { CustomSelect } from "@plane/ui";
// components
import { MemberDropdown } from "@/components/dropdowns";
// constants
import { NETWORK_CHOICES } from "@/constants/project";
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  isMobile?: boolean;
};

const ProjectAttributes: FC<Props> = (props) => {
  const { isMobile = false } = props;
  const { control } = useFormContext<IProject>();
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        name="network"
        control={control}
        render={({ field: { onChange, value } }) => {
          const currentNetwork = NETWORK_CHOICES.find((n) => n.key === value);

          return (
            <div className="flex-shrink-0 h-7" tabIndex={getIndex("network")}>
              <CustomSelect
                value={value}
                onChange={onChange}
                label={
                  <div className="flex items-center gap-1 h-full">
                    {currentNetwork ? (
                      <>
                        <currentNetwork.icon className="h-3 w-3" />
                        {currentNetwork.label}
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
                tabIndex={getIndex("network")}
              >
                {NETWORK_CHOICES.map((network) => (
                  <CustomSelect.Option key={network.key} value={network.key}>
                    <div className="flex items-start gap-2">
                      <network.icon className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{network.label}</p>
                        <p className="text-xs text-custom-text-400">{network.description}</p>
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
          );
        }}
      />
      <Controller
        name="project_lead"
        control={control}
        render={({ field: { value, onChange } }) => {
          if (value === undefined || value === null || typeof value === "string")
            return (
              <div className="flex-shrink-0 h-7" tabIndex={getIndex("lead")}>
                <MemberDropdown
                  value={value}
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
    </div>
  );
};

export default ProjectAttributes;
