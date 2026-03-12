/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller, useFormContext } from "react-hook-form";
import { observer } from "mobx-react";
// plane imports
import { NETWORK_CHOICES, ETabIndices, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomSelect, ToggleSwitch } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectNetworkIcon } from "@/components/project/project-network-icon";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// types
import type { TProject } from "@/plane-web/types/projects";

type Props = {
  isMobile?: boolean;
};

const ProjectAttributes = observer(function ProjectAttributes(props: Props) {
  const { isMobile = false } = props;
  const { t } = useTranslation();
  const { control } = useFormContext<TProject>();
  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

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
                        <ProjectNetworkIcon iconKey={currentNetwork.iconKey} />
                        {t(currentNetwork.i18n_label)}
                      </>
                    ) : (
                      <span className="text-placeholder">{t("select_network")}</span>
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
                      <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                      <div className="-mt-1">
                        <p>{t(network.i18n_label)}</p>
                        <p className="text-11 text-placeholder">{t(network.description)}</p>
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
                  value={value ?? null}
                  onChange={(lead) => onChange(lead === value ? null : lead)}
                  placeholder={t("lead")}
                  multiple={false}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("lead")}
                />
              </div>
            );
          else return <></>;
        }}
      />
      {isAdmin && (
        <Controller
          name="is_bank_wide"
          control={control}
          render={({ field: { value, onChange } }) => (
            <div
              className="flex-shrink-0 h-7 flex items-center gap-2 rounded border border-color-subtle px-2 cursor-pointer"
              onClick={() => onChange(!value)}
            >
              <span className="flex-grow truncate leading-5 text-left text-body-xs-medium">
                {t("bank_wide_project.label")}
              </span>
              <ToggleSwitch value={value ?? false} onChange={() => onChange(!value)} size="sm" />
            </div>
          )}
        />
      )}
    </div>
  );
});

export default ProjectAttributes;

export { ProjectAttributes };

