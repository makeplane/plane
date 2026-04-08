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
import { PIService } from "@/services/pi.service";
import type { PageUtilityEmbedResponse } from "@plane/types";
import { Loader } from "@plane/ui";
import { isValidJsonUISpec } from "@plane/utils";
import { JsonRenderer } from "@plane/propel/json-renderer";
const piService = new PIService();

export type TPiUtilityEmbedWidgetProps = {
  embedId: string;
  embedType?: string | null;
  subType?: string | null;
  title?: string | null;
};

/**
 * PiUtilityEmbedWidget - Fetches embed data from the PI API and renders it.
 * Uses SWR for caching and revalidation. Renders the payload based on embed_type/sub_type.
 */
export function PiUtilityEmbedWidget(props: TPiUtilityEmbedWidgetProps) {
  const { embedId } = props;

  const { data, error, isLoading } = useSWR<PageUtilityEmbedResponse>(
    `pi-utility-embed-${embedId}`,
    () => piService.getPageEmbed(embedId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  if (isLoading) {
    return (
      <Loader>
        <Loader.Item height="60px" />
      </Loader>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md px-4 py-3 bg-layer-1">
        <span className="text-body-sm-regular">Failed to load embed</span>
      </div>
    );
  }

  const jsonString = JSON.stringify(data.payload);

  const parsedJson = isValidJsonUISpec(jsonString);

  return (
    <div className="pi-utility-embed-content rounded-md">
      {parsedJson ? (
        <JsonRenderer jsonString={jsonString} />
      ) : (
        <pre className="overflow-auto text-body-xs-regular">{jsonString}</pre>
      )}
    </div>
  );
}
