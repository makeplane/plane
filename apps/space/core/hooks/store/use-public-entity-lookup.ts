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

import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

type TPublicEntity = {
  id: string;
};

export interface IPublicEntityLookup<T extends TPublicEntity> {
  items: T[] | undefined;
  itemMap: Record<string, T>;
  getById: (id: string | undefined) => T | undefined;
  isLoading: boolean;
  error: unknown;
}

const getAnchorValue = (anchor: string | string[] | undefined) => (typeof anchor === "string" ? anchor : undefined);

export const usePublicEntityLookup = <T extends TPublicEntity>(
  keyPrefix: string,
  fetcher: (anchor: string) => Promise<T[]>
): IPublicEntityLookup<T> => {
  const { anchor } = useParams();
  const resolvedAnchor = getAnchorValue(anchor);

  const { data, isLoading, error } = useSWR(
    resolvedAnchor ? `${keyPrefix}_${resolvedAnchor}` : null,
    resolvedAnchor ? () => fetcher(resolvedAnchor) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const itemMap = useMemo(
    () => Object.fromEntries((data ?? []).map((item) => [item.id, item])) as Record<string, T>,
    [data]
  );

  const getById = useCallback((id: string | undefined) => (id ? itemMap[id] : undefined), [itemMap]);

  return {
    items: data,
    itemMap,
    getById,
    isLoading,
    error,
  };
};
