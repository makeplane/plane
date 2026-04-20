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

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AtSign } from "lucide-react";
// plane imports
import { Combobox } from "@plane/propel/combobox";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Tooltip } from "@plane/propel/tooltip";
import { Switch } from "@plane/propel/switch";
import type { IProject, IWorkspace } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import type { TFocus } from "@/types";

type TProps = {
  workspaceId: string;
  projectId: string;
  focus: TFocus;
  isLoading: boolean;
  setFocus: Dispatch<SetStateAction<TFocus>>;
};
export const FocusFilter = observer(function FocusFilter(props: TProps) {
  const { focus, setFocus, isLoading, workspaceId, projectId } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { joinedProjectIds, getProjectById } = useProject();
  // derived values
  const workspace = getWorkspaceBySlug(workspaceSlug?.toString() || "");
  const selectedFocus = focus.entityType === "workspace_id" ? workspace : getProjectById(focus.entityIdentifier);
  const currentValue = `${focus.entityType}%${focus.entityIdentifier}`;

  // helper
  const updateFocus = <K extends keyof TFocus>(key: K, value: TFocus[K]) => {
    setFocus((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  const handleValueChange = (val: string | string[]) => {
    const value = Array.isArray(val) ? val[0] : val;
    if (!value) return;
    updateFocus("entityType", value.split("%")[0]);
    updateFocus("entityIdentifier", value.split("%")[1]);
    if (!focus.isInWorkspaceContext) {
      updateFocus("isInWorkspaceContext", true);
    }
  };

  // Change focus based on projectId
  useEffect(() => {
    if (projectId) {
      setFocus({
        isInWorkspaceContext: true,
        entityType: "project_id",
        entityIdentifier: projectId.toString(),
      });
    } else {
      setFocus({
        isInWorkspaceContext: true,
        entityType: "workspace_id",
        entityIdentifier: workspaceId?.toString() || "",
      });
    }
  }, [projectId, workspaceId, setFocus]);

  if (isLoading)
    return (
      <Loader>
        <Loader.Item width="100px" height="30px" className="rounded-lg" />
      </Loader>
    );

  return (
    <Combobox value={currentValue} onValueChange={(value) => handleValueChange(value ?? "")}>
      <Tooltip
        tooltipContent="Turn this on if you want AI to use your work data from Plane."
        position="top"
        className="ml-4 max-w-[200px] font-medium text-tertiary"
        disabled={focus.isInWorkspaceContext}
      >
        <Combobox.Button
          className={cn(
            "flex h-[27px] items-center gap-2 rounded-lg px-2 bg-layer-2 border border-subtle-1 overflow-hidden max-w-[200px] hover:bg-surface-1 hover:shadow-raised-100"
          )}
        >
          {!isEmpty(focus) && !isEmpty(selectedFocus) && focus.isInWorkspaceContext ? (
            <div className="flex items-center gap-2 text-13 my-auto capitalize truncate">
              {focus.entityType === "workspace_id" ? (
                <WorkspaceLogo
                  logo={(selectedFocus as IWorkspace)?.logo_url}
                  name={selectedFocus?.name}
                  classNames={"w-4 h-4 text-11 text-on-color"}
                />
              ) : (
                <Logo logo={(selectedFocus as IProject)?.logo_props} />
              )}
              <span className="truncate text-body-xs-medium text-primary">{selectedFocus?.name}</span>
            </div>
          ) : (
            <div className="text-sm font-medium my-auto flex items-center gap-2">
              <AtSign className="size-4 text-icon-tertiary" />
              <span className="text-body-xs-medium text-primary">Add context</span>
            </div>
          )}
        </Combobox.Button>
      </Tooltip>
      <Combobox.Options className="max-w-[220px]" maxHeight="lg" dataPreventOutsideClick>
        <div className="flex flex-col divide-y divide-subtle-1 space-y-2 max-w-[192px] max-h-full">
          <div>
            <span className="text-tertiary font-medium text-13 px-2">Ask AI to use data from:</span>
            <Combobox.Option
              value={`workspace_id%${workspace?.id}`}
              className="text-13 text-secondary font-medium flex justify-start items-center mb-2 data-[highlighted]:bg-layer-transparent-hover"
            >
              <div className="flex flex-start gap-2 max-w-full items-center">
                <WorkspaceLogo
                  logo={workspace?.logo_url}
                  name={workspace?.name}
                  classNames={"w-4 h-4 text-11 text-on-color"}
                />
                <span className="truncate">{workspace?.name}</span>
              </div>
            </Combobox.Option>
            {joinedProjectIds && joinedProjectIds.length > 0 && (
              <span className="text-tertiary font-medium text-13 px-2">Projects</span>
            )}
            {joinedProjectIds &&
              joinedProjectIds.map((id: string) => {
                const project = getProjectById(id);
                return (
                  <Combobox.Option
                    key={id}
                    value={`project_id%${id}`}
                    className="text-13 text-secondary font-medium data-[highlighted]:bg-layer-transparent-hover"
                  >
                    <div className="flex flex-start gap-2 max-w-full">
                      <div className="size-4 my-auto">{project && <Logo logo={project?.logo_props} />}</div>
                      <span className="truncate">{project?.name}</span>
                    </div>
                  </Combobox.Option>
                );
              })}
          </div>
          <div className="pt-2 flex justify-between gap-2 px-2">
            <div className="text-wrap font-medium text-tertiary text-11">
              Turn this off if you don&apos;t want AI to use your work from Plane.
            </div>
            <Switch
              value={focus.isInWorkspaceContext ?? false}
              onChange={() => {
                updateFocus("isInWorkspaceContext", !focus.isInWorkspaceContext);
              }}
            />
          </div>
        </div>
      </Combobox.Options>
    </Combobox>
  );
});
