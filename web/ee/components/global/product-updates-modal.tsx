import { FC, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import useSWR from "swr";
import { ExternalLink, RefreshCw } from "lucide-react";
// editor
import { DocumentReadOnlyEditorWithRef, EditorRefApi } from "@plane/editor";
// ui
import { Button, EModalPosition, EModalWidth, getButtonStyling, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { LogoSpinner } from "@/components/common";
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance } from "@/hooks/store";
// assets
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
// services
import { InstanceService } from "@/services/instance.service";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

const instanceService = new InstanceService();

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  // states
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  // store
  const { config, isUpdateAvailable, updateInstanceInfo } = useInstance();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // derived values
  const PLANE_CHANGELOG_URL = config?.instance_changelog_url ?? "";
  // swr
  const { data, isLoading, error } = useSWR(`INSTANCE_CHANGELOG_${PLANE_CHANGELOG_URL}`, () =>
    PLANE_CHANGELOG_URL ? instanceService.getInstanceChangeLog(PLANE_CHANGELOG_URL) : null
  );

  const handleCheckForUpdates = () => {
    setIsCheckingForUpdates(true);
    instanceService
      .checkForUpdates()
      .then((response) => {
        updateInstanceInfo({
          current_version: response.current_version,
          latest_version: response.latest_version,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to check for updates",
        });
      })
      .finally(() => {
        setIsCheckingForUpdates(false);
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="flex gap-2 mx-6 my-4 items-center justify-between flex-shrink-0">
        <div className="flex w-full items-center">
          <div className="flex gap-2 text-xl font-medium">Product updates</div>
          {isUpdateAvailable ? (
            <a
              tabIndex={-1}
              href="https://docs.plane.so/plane-one/self-host/manage/prime-cli"
              className={cn(
                "flex gap-1 items-center px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-600"
              )}
              target="_blank"
              rel="noreferrer noopener"
            >
              Update available
              <ExternalLink className="h-3 w-3" strokeWidth={2} />
            </a>
          ) : (
            <div
              className={cn(
                "px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100"
              )}
            >
              Latest
            </div>
          )}
          {!isUpdateAvailable && (
            <Button
              variant="link-neutral"
              size="sm"
              className="font-medium outline-none px-1"
              onClick={handleCheckForUpdates}
            >
              Check for updates
              <RefreshCw size={10} className={cn("animate-spin", { "opacity-0": !isCheckingForUpdates })} />
            </Button>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center gap-8">
          {subscriptionDetail?.is_self_managed && subscriptionDetail?.product === "ONE" && (
            <div className="cursor-default rounded-md bg-green-500/10 px-2 py-0.5 text-center text-xs font-medium text-green-500 outline-none leading-6">
              Perpetual license
            </div>
          )}
          <Image src={PlaneLogo} alt="Plane" width={24} height={24} />
        </div>
      </div>
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {!PLANE_CHANGELOG_URL || !!error ? (
          <div className="flex flex-col items-center justify-center w-full h-full mb-8">
            <div className="text-lg font-medium">We are having trouble fetching the updates.</div>
            <div className="text-sm text-custom-text-200">
              Please visit{" "}
              <a
                href="https://go.plane.so/p-changelog"
                target="_blank"
                className="text-sm text-custom-primary-100 font-medium hover:text-custom-primary-200 underline underline-offset-1 outline-none"
              >
                our changelogs
              </a>{" "}
              for the latest updates.
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <LogoSpinner />
          </div>
        ) : (
          <div className="ml-5">
            {data?.id && (
              <DocumentReadOnlyEditorWithRef
                ref={editorRef}
                id={data.id}
                initialValue={data.description_html ?? "<p></p>"}
                containerClassName="p-0 pb-64 border-none"
                mentionHandler={{
                  highlights: () => Promise.resolve([]),
                }}
                embedHandler={{
                  issue: {
                    widgetCallback: () => <></>,
                  },
                }}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between flex-shrink-0 gap-4 m-6 mb-4">
        <div className="flex items-center gap-2">
          <a
            href="https://go.plane.so/p-docs"
            target="_blank"
            className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
          >
            Docs
          </a>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <a
            href="https://go.plane.so/p-changelog"
            target="_blank"
            className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
          >
            Full changelog
          </a>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <a
            href="mailto:support@plane.so"
            target="_blank"
            className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
          >
            Support
          </a>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <a
            href="https://go.plane.so/p-discord"
            target="_blank"
            className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
          >
            Discord
          </a>
        </div>
        <a
          href="https://plane.so/pages"
          target="_blank"
          className={cn(
            getButtonStyling("accent-primary", "sm"),
            "flex gap-1.5 items-center text-center font-medium hover:underline underline-offset-2 outline-none"
          )}
        >
          <Image src={PlaneLogo} alt="Plane" width={12} height={12} />
          Powered by Plane Pages
        </a>
      </div>
    </ModalCore>
  );
});
