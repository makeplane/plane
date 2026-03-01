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
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import { UnauthorizedView } from "../unauthorized";
import type { TTemplate } from "@/types";

type TProps = {
  isFullScreen: boolean;
  mode: string;
  projectId: string | undefined;
  entityId: string | undefined;
  entityType: string | undefined;
  onClick: (query: string) => void;
};
export const ContextualTemplates = observer(function ContextualTemplates(props: TProps) {
  const { isFullScreen, mode, projectId, entityId, entityType, onClick } = props;
  // store hooks
  const { workspaceSlug } = useParams();
  const { getInstance, isPiTyping, fetchPrompts } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString())?.id;
  // SWR
  const { data: instance, isLoading } = useSWR(
    workspaceId ? `PI_STARTER_${workspaceId}` : null,
    workspaceId ? () => getInstance(workspaceId) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      errorRetryCount: 0,
    }
  );
  const { data, isLoading: isLoadingPrompts } = useSWR(
    workspaceId ? `PI_PRESET_TEMPLATES_${workspaceId}_${mode}_${projectId}_${entityId}_${entityType}` : null,
    workspaceId ? () => fetchPrompts(workspaceId, mode, projectId, entityId, entityType) : null
  );
  if (!isLoading && !instance?.is_authorized) return <UnauthorizedView />;
  return (
    <div>
      {isLoading || isLoadingPrompts ? (
        <Loader className="flex flex-wrap m-auto justify-center w-full rounded-xl overflow-hidden">
          <Loader.Item width="100%" height="90px" />
        </Loader>
      ) : (
        <div
          className={cn("flex flex-col m-auto justify-center rounded-b-xl overflow-hidden", {
            "rounded-xl": !isFullScreen,
          })}
        >
          {instance?.is_authorized &&
            data?.templates?.map((prompt: TTemplate, index: number) => (
              <button
                key={index}
                className={cn("bg-layer-1 flex w-full px-3 py-2 hover:bg-layer-1-hover")}
                onClick={(e) => {
                  e.preventDefault();
                  onClick(prompt.text);
                }}
                disabled={isPiTyping}
              >
                <span className="text-left text-body-sm-regular text-primary break-words line-clamp-2">
                  {prompt.text}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
});
