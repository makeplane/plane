import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Copy, ExternalLink, RefreshCcw } from "lucide-react";
import { TInboxForm } from "@plane/types";
import { Button, Loader, setPromiseToast, setToast, TOAST_TYPE, ToggleSwitch } from "@plane/ui";
import { TProperties } from "@/ce/constants";
import { SPACE_BASE_PATH, SPACE_BASE_URL } from "@/helpers/common.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
import { useProjectInbox } from "@/hooks/store";
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
  isAdmin?: boolean;
  handleSubmit?: (featureKey: string, featureProperty: string) => Promise<void>;
  allowEdit?: boolean;
  showDefault?: boolean;
  featureList: TIntakeFeatureList;
};
const IntakeSubFeatures = observer((props: Props) => {
  const { projectId, isAdmin, allowEdit = true, showDefault = true, featureList } = props;
  const { workspaceSlug } = useParams();
  const [modalType, setModalType] = useState("");
  const { fetchIntakeForms, toggleIntakeForms, regenerateIntakeForms, intakeForms } = useProjectInbox();

  // fetching intake forms
  useSWR(
    workspaceSlug && projectId ? `INTAKE_FORMS_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => fetchIntakeForms(workspaceSlug.toString(), projectId.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId) return null;

  // Derived Values
  const settings = intakeForms[projectId];

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
      {Object.keys(featureList)
        .filter((featureKey) => featureKey !== "in-app" || showDefault)
        .map((featureKey) => {
          const feature = featureList[featureKey];
          const SPACE_APP_URL =
            (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
          const publishLink = `${SPACE_APP_URL}/intake/${settings?.anchor}`;
          const key = `is_${featureKey}_enabled`;

          return (
            <div key={featureKey} className="gap-x-8 gap-y-3 bg-custom-background-100 pb-2 pt-4">
              <div key={featureKey} className="flex items-center justify-between">
                <div>
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center rounded my-auto">{feature.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium leading-5">{feature.title}</h4>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm leading-5 tracking-tight text-custom-text-300 text-wrap">
                    {feature.description}
                  </p>
                </div>
                {allowEdit && handleSubmit && settings && (
                  <ToggleSwitch
                    value={Boolean(settings[key as keyof TInboxForm])}
                    onChange={(e) => handleSubmit(key as keyof TInboxForm)}
                    disabled={!feature.isEnabled || !isAdmin}
                    size="sm"
                  />
                )}
                {!settings && (
                  <Loader>
                    <Loader.Item height="16px" width="24px" className="rounded-lg" />
                  </Loader>
                )}
              </div>
              {feature.hasOptions && settings && settings[key as keyof TInboxForm] && (
                <div className="flex gap-2 h-[30px] mt-2 w-full">
                  {settings?.anchor ? (
                    <div className="flex items-center text-sm rounded-md border-[0.5px] border-custom-border-300 w-full max-w-[500px] py-1 px-2 gap-2 h-full">
                      <span className="truncate flex-1 mr-4">{publishLink}</span>
                      <Copy
                        className="text-custom-text-400 w-[16px] cursor-pointer"
                        onClick={() => copyToClipboard("abc")}
                      />
                      {feature.hasHyperlink && (
                        <a href={publishLink} target="_blank">
                          <ExternalLink className="text-custom-text-400 w-[16px] cursor-pointer" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <Loader>
                      <Loader.Item height="30px" width="360px" className="rounded" />
                    </Loader>
                  )}
                  {allowEdit && (
                    <Button
                      tabIndex={-1}
                      size="sm"
                      variant="accent-primary"
                      className="w-fit cursor-pointer px-2 py-1 text-center text-sm font-medium outline-none my-auto h-full"
                      onClick={() => setModalType(featureKey)}
                    >
                      <RefreshCcw className="w-[16px]" /> Renew
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </>
  );
});

export default IntakeSubFeatures;
