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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { RefreshCcw } from "lucide-react";
import { CopyIcon, NewTabIcon } from "@plane/propel/icons";
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import type { TInboxForm } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn, copyTextToClipboard } from "@plane/utils";
// ce imports
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";
import type { TIntakeFeatureList } from "@/constants/project/settings/features";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import { IntakeFormsRoot } from "./forms-root";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";
import { RenewModal } from "./renew-modal";

type Props = {
  projectId?: string;
  allowEdit?: boolean;
  showDefault?: boolean;
  featureList: TIntakeFeatureList;
  isTooltip?: boolean;
};
const IntakeSubFeatures = observer(function IntakeSubFeatures(props: Props) {
  const { projectId, allowEdit = true, showDefault = true, featureList, isTooltip = false } = props;
  const { workspaceSlug } = useParams();
  const [modalType, setModalType] = useState("");
  const { fetchIntakeForms, toggleIntakeForms, regenerateIntakeForms, intakeForms } = useProjectInbox();
  const { isUpdatingProject } = useProject();
  const { allowPermissions } = useUserPermissions();

  // fetching intake forms
  useSWR(
    workspaceSlug && projectId && !isUpdatingProject ? `INTAKE_FORMS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId && !isUpdatingProject
      ? () => fetchIntakeForms(workspaceSlug.toString(), projectId.toString())
      : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return null;

  // Derived Values
  const isIntakeEmailEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL);
  const isIntakeFormEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM);
  const isFeatureAllowed = {
    email: isIntakeEmailEnabled,
    in_app: true,
    form: isIntakeFormEnabled,
  };

  const settings = intakeForms[projectId];
  const isAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    projectId
  );

  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied to clipboard",
        message: "The URL has been successfully copied to your clipboard",
      })
    );
  };

  const handleSubmit = async (featureKey: keyof TInboxForm) => {
    if (!workspaceSlug || !projectId || !projectId) return;

    const updateProjectPromise = toggleIntakeForms(workspaceSlug.toString(), projectId, {
      [featureKey]: !settings[featureKey],
    });
    setPromiseToast(updateProjectPromise, {
      loading: "Updating project feature...",
      success: {
        title: "Success!",
        message: () => "Project feature updated successfully.",
      },
      error: {
        title: "Error!",
        message: () => "Something went wrong while updating project feature. Please try again.",
      },
    });
  };

  return (
    <>
      {workspaceSlug && projectId && (
        <RenewModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
          isOpen={modalType !== ""}
          onClose={() => setModalType("")}
          source={modalType}
          handleSubmit={regenerateIntakeForms}
        />
      )}
      <div className={cn(isTooltip ? "divide-y divide-subtle-1/50" : "")}>
        {Object.keys(featureList)
          .filter((featureKey) => featureKey !== "in-app" || showDefault)
          .map((featureKey) => {
            if (featureKey === "form") return null;

            const feature = featureList[featureKey as keyof TIntakeFeatureList];
            const publishLink = settings?.anchors?.[feature.key];
            const key = `is_${featureKey}_enabled`;

            if (!isFeatureAllowed[featureKey as keyof typeof isFeatureAllowed])
              return (
                <IntakeSubFeaturesUpgrade
                  key={featureKey}
                  projectId={projectId}
                  featureList={{
                    [featureKey]: feature,
                  }}
                  className="mt-0"
                />
              );
            return (
              <div key={featureKey} className="gap-x-8 gap-y-3 py-3">
                <div key={featureKey} className="flex justify-between gap-2">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1 w-full">
                        <div className="text-13 font-medium leading-5 align-top ">{feature.title}</div>
                        <p className="text-13 text-tertiary text-wrap mt-1">{feature.description} </p>
                      </div>
                      <div className={cn(!isTooltip && "flex items-center")}>
                        {settings && (
                          <Tooltip
                            tooltipContent={`Ask your Project Admin to turn this ${settings[key as keyof TInboxForm] ? "off" : "on"}.`}
                            position="top"
                            className=""
                            disabled={isAdmin}
                          >
                            <div>
                              <Switch
                                value={Boolean(settings[key as keyof TInboxForm])}
                                onChange={() => handleSubmit(key as keyof TInboxForm)}
                                disabled={!feature.isEnabled || !isAdmin}
                              />
                            </div>
                          </Tooltip>
                        )}
                        {(!settings || (!settings && isUpdatingProject)) && (
                          <Loader>
                            <Loader.Item height="16px" width="24px" className="rounded-lg" />
                          </Loader>
                        )}
                      </div>
                    </div>

                    {feature.hasOptions && settings && settings[key as keyof TInboxForm] && (
                      <div className="rounded-md space-y-2">
                        <div className="p-3 space-y-2">
                          <div className="flex gap-2 rounded">
                            {feature.icon} <span className="text-11 font-medium">{feature.fieldName}</span>
                          </div>
                          <div className="flex gap-2 h-[30px] w-full">
                            {settings?.anchors?.[feature.key] ? (
                              <div
                                className={cn(
                                  "flex items-center text-13 rounded-md border-[0.5px] border-subtle-1 flex-1 py-1 px-2 gap-2 h-full",
                                  {
                                    "w-[320px]": isTooltip,
                                  }
                                )}
                              >
                                <span className="truncate flex-1 mr-4">{publishLink}</span>
                                <CopyIcon
                                  className="text-placeholder w-[16px] cursor-pointer"
                                  onClick={() => copyToClipboard(publishLink)}
                                />
                                {feature.hasHyperlink && (
                                  <a href={publishLink} target="_blank" rel="noreferrer">
                                    <NewTabIcon className="text-placeholder w-[16px] cursor-pointer" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Loader>
                                <Loader.Item height="30px" width="250px" className="rounded" />
                              </Loader>
                            )}
                            {allowEdit && settings?.anchors?.[feature.key] && (
                              <Button
                                tabIndex={-1}
                                variant="secondary"
                                className="w-fit cursor-pointer px-2 py-1 text-center text-13 font-medium outline-none my-auto h-full"
                                onClick={() => setModalType(feature.key)}
                              >
                                <RefreshCcw className="w-[16px]" /> Renew
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Intake Forms */}
        <IntakeFormsRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId}
          isAdmin={isAdmin}
          isEnabled={isFeatureAllowed.form}
          allowEdit={allowEdit}
          isFormEnabled={settings?.is_form_enabled}
          anchor={settings?.anchors?.intake}
          isToolTip={isTooltip}
        />
      </div>
    </>
  );
});

export default IntakeSubFeatures;
