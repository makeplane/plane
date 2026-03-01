/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ChevronDownIcon } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { MembersPropertyIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn, getSubscriptionName } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { SettingsHeading } from "@/components/settings/heading";
// plane web imports
import type { TIntakeResponsibilityList } from "@/constants/project/settings/features";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { useIntakeResponsibility } from "@/plane-web/hooks/store/use-intake-responsibility";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";

type Props = {
  projectId?: string;
  featureList: TIntakeResponsibilityList;
};

const IntakeResponsibility = observer(function IntakeResponsibility(props: Props) {
  const { projectId, featureList } = props;
  const { workspaceSlug } = useParams();
  //   hooks
  const { t } = useTranslation();
  // store hooks
  const { getAssignees, fetchIntakeAssignees, updateIntakeAssignees } = useIntakeResponsibility();
  const { togglePaidPlanModal } = useWorkspaceSubscription();

  const assignees = projectId ? getAssignees(projectId) : [];
  /**Fetch intake assignee */
  useSWR(
    workspaceSlug && projectId ? `INTAKE_ASSIGNEE_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchIntakeAssignees(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // Derived Values
  const isResponsibilityEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_RESPONSIBILITY);

  if (!workspaceSlug || !projectId) return null;

  const intakeT = (path: string) => t(`project_settings.features.intake.${path}`);

  const handleAssigneeChange = async (val: string[]) => {
    if (!workspaceSlug || !projectId) return;

    const updatePromise = updateIntakeAssignees(workspaceSlug, projectId, { users: val });

    setPromiseToast(updatePromise, {
      loading: intakeT("toasts.set.loading"),
      success: {
        title: intakeT("toasts.set.success.title"),
        message: () => intakeT("toasts.set.success.message"),
      },
      error: {
        title: intakeT("toasts.set.error.title"),
        message: () => intakeT("toasts.set.error.message"),
      },
    });
  };

  return (
    <>
      <SettingsHeading title={intakeT("heading")} variant="h6" />
      <div className="mt-4 px-4 rounded-lg border transition-all border-subtle bg-layer-2">
        {Object.entries(featureList).map(([featureKey, feature]) => (
          <div key={featureKey} className="gap-y-3 gap-x-8 py-3">
            <div key={featureKey} className="flex gap-2 justify-between">
              <div className="flex gap-2 w-full">
                <div className="flex justify-center mt-1 rounded">{feature.icon}</div>
                <div className="w-full">
                  <div className="flex gap-2 justify-between">
                    <div className="flex-1 w-full">
                      <div className="flex gap-2">
                        <div className="text-13 font-medium leading-5 align-top">{intakeT(`${featureKey}.title`)}</div>
                        {!isResponsibilityEnabled && (
                          <div className="rounded-sm px-2 py-px text-11 font-medium capitalize items-center text-plans-brand-primary bg-plans-brand-subtle">
                            <h1>{getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}</h1>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-13 text-tertiary text-wrap">{intakeT(`${featureKey}.description`)}</p>
                    </div>
                    <div className="flex items-center h-8 max-w-40">
                      {isResponsibilityEnabled ? (
                        <MemberDropdown
                          value={assignees}
                          onChange={handleAssigneeChange}
                          projectId={projectId}
                          placeholder={t("no_assignee")}
                          multiple
                          showUserDetails
                          buttonVariant="border-with-text"
                          className="w-full"
                          buttonContainerClassName="w-full text-left"
                          buttonClassName={assignees.length > 0 ? "hover:bg-transparent" : ""}
                          dropdownArrow
                        />
                      ) : (
                        <button
                          type="button"
                          className="block w-full max-w-full h-full text-left opacity-30 cursor-pointer outline-none clickable"
                          onClick={() => togglePaidPlanModal(true)}
                        >
                          <div className="h-full w-full flex items-center gap-1.5 border-[0.5px] border-subtle-1 hover:bg-layer-1 rounded-sm px-2 py-0.5 text-11">
                            <MembersPropertyIcon className={cn("shrink-0 w-3 h-3 mx-1")} />
                            <span className="grow leading-5 truncate">{t("no_assignee")}</span>
                            <ChevronDownIcon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

export default IntakeResponsibility;
