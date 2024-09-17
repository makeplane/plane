import { Button, Input, setToast, TOAST_TYPE, ToggleSwitch, Tooltip } from "@plane/ui";
import { INTAKE_FEATURES_LIST } from "../../../../ce/constants/project/settings/features";
import { UpgradeBadge } from "ee/components/workspace";
import { IProject } from "@plane/types";
import { Copy, ExternalLink, RefreshCcw } from "lucide-react";
import { copyTextToClipboard } from "@/helpers/string.helper";

type Props = {
  projectDetails?: IProject;
  isAdmin?: boolean;
  handleSubmit?: (featureKey: string, featureProperty: string) => Promise<void>;
  allowEdit?: boolean;
  showDefault?: boolean;
};
const IntakeSubFeatures = (props: Props) => {
  const { projectDetails, isAdmin, handleSubmit, allowEdit = true, showDefault = true } = props;
  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied to clipboard",
        message: "The URL has been successfully copied to your clipboard",
      })
    );
  };

  return Object.keys(INTAKE_FEATURES_LIST)
    .filter((featureKey) => featureKey !== "in-app" || showDefault)
    .map((featureKey) => {
      const feature = INTAKE_FEATURES_LIST[featureKey];
      return (
        <div key={featureKey} className="gap-x-8 gap-y-3 bg-custom-background-100 pb-2 pt-4">
          <div key={featureKey} className="flex items-center justify-between">
            <div>
              <div className="flex items-start gap-2">
                <div className="flex items-center justify-center rounded my-auto">{feature.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium leading-5">{feature.title}</h4>
                    {feature.isPro && (
                      <Tooltip tooltipContent="Pro feature" position="top">
                        <UpgradeBadge />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm leading-5 tracking-tight text-custom-text-300">{feature.description}</p>
            </div>
            {allowEdit && handleSubmit && (
              <ToggleSwitch
                value={Boolean(projectDetails?.[feature.property as keyof IProject])}
                onChange={() => handleSubmit(featureKey, feature.property)}
                disabled={!feature.isEnabled || !isAdmin}
                size="sm"
              />
            )}
          </div>
          {feature.hasOptions && (
            <div className="flex gap-2 h-[30px] mt-2 w-full">
              <div className="flex items-center text-sm rounded-md border-[0.5px] border-custom-border-300 w-full max-w-[500px] py-1 px-2 gap-2 h-full">
                <span className="truncate flex-1 mr-4">
                  https://sites.plane.so/views/65f53425fe764f2589f28495fa0e8262/65f53425fe764f2589f28495fa0e8262
                </span>
                <Copy className="text-custom-text-400 w-[16px] cursor-pointer" onClick={() => copyToClipboard("abc")} />
                {feature.hasHyperlink && (
                  <a href="" target="_blank">
                    <ExternalLink className="text-custom-text-400 w-[16px] cursor-pointer" />
                  </a>
                )}
              </div>
              {allowEdit && (
                <Button
                  tabIndex={-1}
                  size="sm"
                  variant="accent-primary"
                  className="w-fit cursor-pointer px-2 py-1 text-center text-sm font-medium outline-none my-auto h-full"
                  onClick={() => console.log("Upgrade")}
                >
                  <RefreshCcw className="w-[16px]" /> Renew
                </Button>
              )}
            </div>
          )}
        </div>
      );
    });
};

export default IntakeSubFeatures;
