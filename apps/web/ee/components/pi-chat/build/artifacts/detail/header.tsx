"use-client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Header as HeaderUI, Row } from "@plane/ui";
import { CustomSelect } from "@plane/ui/src";
import { cn } from "@plane/utils";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { TArtifact } from "@/plane-web/types";
import { getIcon } from "../../preview-block";

const buttonClass =
  "w-auto p-2 rounded-lg text-custom-text-200 grid place-items-center border-[0.5px] border-custom-sidebar-border-300 bg-custom-background-200 hover:shadow-sm hover:text-custom-text-300";
export const Header = observer((props: { artifact: TArtifact }) => {
  const { artifact } = props;
  const { toggleSidebar } = useAppTheme();
  const {
    togglePiArtifactsDrawer,
    activeChatId,
    artifactsStore: { getArtifactsByChatId },
  } = usePiChat();
  const artifacts = getArtifactsByChatId(activeChatId);
  return (
    <Row className="h-header flex gap-2 w-full items-center rounded-tl-lg rounded-tr-lg">
      <HeaderUI className="bg-custom-background-90">
        <HeaderUI.LeftItem>
          <CustomSelect
            value={artifact}
            label={
              <Tooltip position="bottom" className="ml-4 max-w-[200px] font-medium text-custom-text-300">
                <div className="flex gap-2 items-center text-sm font-medium">
                  {getIcon(artifact.artifact_type)}
                  <div>{artifact.parameters?.name || "Unknown"}</div>
                </div>
              </Tooltip>
            }
            onChange={(val: TArtifact) => {
              if (!val?.artifact_id) return;
              togglePiArtifactsDrawer(val.artifact_id);
            }}
            maxHeight="lg"
            className="flex flex-col-reverse"
            buttonClassName={cn(
              "border-none flex gap-2 rounded-md h-full px-2 max-h-[30px] overflow-hidden max-w-[200px]"
            )}
            optionsClassName="max-h-[70vh] overflow-y-auto"
          >
            <div className="flex flex-col divide-y divide-custom-border-100 space-y-2 max-w-[192px] max-h-full">
              <div>
                {artifacts &&
                  artifacts.map((artifactData) => (
                    <CustomSelect.Option
                      key={artifactData?.artifact_id}
                      value={artifactData}
                      className="text-sm text-custom-text-200 font-medium"
                    >
                      <div className="flex gap-2 items-center text-sm font-medium">
                        {getIcon(artifactData?.artifact_type || "")}
                        <div>{artifactData?.parameters?.name || "Unknown"}</div>
                      </div>
                    </CustomSelect.Option>
                  ))}
              </div>
            </div>
          </CustomSelect>
        </HeaderUI.LeftItem>
        <HeaderUI.RightItem>
          <div className="flex gap-2">
            <Tooltip tooltipContent="Start a new chat" position="left">
              <button
                className={cn(buttonClass, "border-none")}
                onClick={() => {
                  togglePiArtifactsDrawer();
                  toggleSidebar();
                }}
              >
                <X className="flex-shrink-0 size-3.5" />
              </button>
            </Tooltip>
          </div>
        </HeaderUI.RightItem>
      </HeaderUI>
    </Row>
  );
});
