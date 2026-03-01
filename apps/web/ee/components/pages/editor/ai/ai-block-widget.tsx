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

import useSWR from "swr";
// plane editor
import { CustomAIBlockUI } from "@plane/editor";
import type { TAIBlockNodeViewProps } from "@plane/editor";
import { useParams } from "next/navigation";
import { PIService } from "@/services/pi.service";
const piService = new PIService();

/**
 * AIBlockWidget - Web app component that fetches data and renders the AI block UI.
 * This component uses SWR to fetch blockTypes, revisionTypes, and blocks,
 * then passes them to the CustomAIBlockUI component from the editor package.
 */
export function AIBlockWidget(props: TAIBlockNodeViewProps) {
  const { pageId } = useParams<{ pageId: string }>();

  // Fetch block types
  const { data: blockTypesData } = useSWR("ai-block-types", async () => {
    const response = await piService.getBlockTypes();
    return response?.types ?? [];
  });

  // Fetch blocks list
  const { data: blocksData } = useSWR(pageId ? `ai-block-list-${pageId}` : null, async () => {
    const response = await piService.listBlocks(pageId);
    return response?.blocks ?? [];
  });

  return <CustomAIBlockUI {...props} blockTypes={blockTypesData ?? []} blocks={blocksData ?? []} />;
}
