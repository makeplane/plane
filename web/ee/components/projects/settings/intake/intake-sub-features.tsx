import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Copy, ExternalLink, RefreshCcw } from "lucide-react";
import { E_FEATURE_FLAGS, EUserPermissionsLevel, EUserProjectRoles } from "@plane/constants";
import { TInboxForm } from "@plane/types";
import { Button, Loader, setPromiseToast, setToast, TOAST_TYPE, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
import { TProperties } from "@/ce/constants";
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
import { useProject, useProjectInbox, useUserPermissions } from "@/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
import IntakeSubFeaturesUpgrade from "./intake-sub-features-upgrade";
import { RenewModal } from "./renew-modal";

export type TIntakeFeatureList = {
  [key: string]: TProperties & {
    hasOptions: boolean;
    hasHyperlink?: boolean;
    canShuffle?: boolean;
  };
};
type Props = {
  projectId?: string;
  allowEdit?: boolean;
  showDefault?: boolean;
  featureList: TIntakeFeatureList;
  isTooltip?: boolean;
};
const IntakeSubFeatures = observer((props: Props) => {
  const { projectId, allowEdit = true, showDefault = true, featureList, isTooltip = false } = props;
  const { workspaceSlug } = useParams();
  const [modalType, setModalType] = useState("");
  const { fetchIntakeForms, toggleIntakeForms, regenerateIntakeForms, intakeForms } = useProjectInbox();
  const { isUpdatingProject } = useProject();
  const { allowPermissions } = useUserPermissions();
  const isFeatureAllowed = {
    email: useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_EMAIL),
    form: useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.INTAKE_FORM),
    in_app: true,
  };

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
      <div className={cn(isTooltip ? "divide-y divide-custom-border-200/50" : "mt-3")}>
        {Object.keys(featureList)
          .filter((featureKey) => featureKey !== "in-app" || showDefault)
          .map((featureKey) => {
            const feature = featureList[featureKey];
            const SPACE_APP_URL =
              (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
            const publishLink =
              featureKey === "form"
                ? `${SPACE_APP_URL}/intake/${settings?.anchors?.[feature.key]}`
                : settings?.anchors?.[feature.key];
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
              <div key={featureKey} className="gap-x-8 gap-y-3 bg-custom-background-100 py-3">
                <div key={featureKey} className={cn("flex justify-between gap-2", {})}>
                  <div className="flex gap-2 w-full">
                    <div className="flex justify-center rounded mt-1">{feature.icon}</div>
                    <div className="w-full">
                      <div className={cn("flex justify-between gap-4", {})}>
                        <div className="flex-1 w-full">
                          <div className="text-sm font-medium leading-5 align-top ">{feature.title}</div>
                          <p className="text-sm text-custom-text-300 text-wrap mt-1">{feature.description} </p>
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
                                <ToggleSwitch
                                  value={Boolean(settings[key as keyof TInboxForm])}
                                  onChange={(e) => handleSubmit(key as keyof TInboxForm)}
                                  disabled={!feature.isEnabled || !isAdmin}
                                  size="sm"
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
                        <div className="flex gap-2 h-[30px] mt-2 w-full">
                          {settings?.anchors[feature.key] ? (
                            <div
                              className={cn(
                                "flex items-center text-sm rounded-md border-[0.5px] border-custom-border-300 w-[400px] py-1 px-2 gap-2 h-full",
                                {
                                  "w-[320px]": isTooltip,
                                }
                              )}
                            >
                              <span className="truncate flex-1 mr-4">{publishLink}</span>
                              <Copy
                                className="text-custom-text-400 w-[16px] cursor-pointer"
                                onClick={() => copyToClipboard(publishLink)}
                              />
                              {feature.hasHyperlink && (
                                <a href={publishLink} target="_blank">
                                  <ExternalLink className="text-custom-text-400 w-[16px] cursor-pointer" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <Loader>
                              <Loader.Item height="30px" width="250px" className="rounded" />
                            </Loader>
                          )}
                          {allowEdit && settings?.anchors[feature.key] && (
                            <Button
                              tabIndex={-1}
                              size="sm"
                              variant="accent-primary"
                              className="w-fit cursor-pointer px-2 py-1 text-center text-sm font-medium outline-none my-auto h-full"
                              onClick={() => setModalType(feature.key)}
                            >
                              <RefreshCcw className="w-[16px]" /> Renew
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
});

export default IntakeSubFeatures;
