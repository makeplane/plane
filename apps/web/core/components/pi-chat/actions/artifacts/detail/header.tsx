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

import { uniqBy } from "lodash-es";
import { observer } from "mobx-react";
import { CloseIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { Header as HeaderUI, Row, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import type { TArtifact } from "@/types";
import { getIcon } from "../../preview-block";

const buttonClass =
  "w-auto p-2 rounded-lg text-secondary grid place-items-center border-[0.5px] border-strong bg-layer-2 hover:shadow-sm hover:text-tertiary";
export const Header = observer(function Header(props: { artifact: TArtifact }) {
  const { artifact } = props;
  const { toggleSidebar } = useAppTheme();
  const {
    togglePiArtifactsDrawer,
    activeChatId,
    artifactsStore: { getArtifactsByChatId },
  } = usePiChat();
  const artifacts = getArtifactsByChatId(activeChatId);
  return (
    <Row className={cn("py-2 flex gap-2 w-full items-center rounded-tl-lg rounded-tr-lg shrink-0")}>
      <HeaderUI className="bg-transparent">
        <HeaderUI.LeftItem>
          <CustomSelect
            value={artifact}
            label={
              <Tooltip position="bottom" className="ml-4 max-w-[200px] font-medium text-tertiary">
                <div className="flex gap-2 items-center text-body-sm-medium overflow-hidden">
                  <div className="flex-shrink-0"> {getIcon(artifact.artifact_type)}</div>
                  <div className="truncate">{artifact.parameters?.name || "Unknown"}</div>
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
            <div className="flex flex-col divide-y divide-subtle space-y-2 max-w-[192px] max-h-full">
              <div>
                {artifacts &&
                  uniqBy(artifacts, "artifact_id").map((artifactData) => (
                    <CustomSelect.Option
                      key={artifactData?.artifact_id}
                      value={artifactData}
                      className="text-13 text-secondary font-medium"
                    >
                      <div className="flex gap-2 items-center text-13 font-medium overflow-hidden">
                        <div className="flex-shrink-0"> {getIcon(artifactData?.artifact_type || "")}</div>
                        <div className="truncate">{artifactData?.parameters?.name || "Unknown"}</div>
                      </div>
                    </CustomSelect.Option>
                  ))}
              </div>
            </div>
          </CustomSelect>
        </HeaderUI.LeftItem>
        <HeaderUI.RightItem>
          <div className="flex gap-2">
            <button
              className={cn(buttonClass, "border-none")}
              onClick={() => {
                togglePiArtifactsDrawer();
                toggleSidebar();
              }}
            >
              <CloseIcon className="flex-shrink-0 size-3.5" />
            </button>
          </div>
        </HeaderUI.RightItem>
      </HeaderUI>
    </Row>
  );
});
