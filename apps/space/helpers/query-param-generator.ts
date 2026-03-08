/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type TQueryParamValue = string | string[] | boolean | number | bigint | undefined | null;

export const queryParamGenerator = (queryObject: Record<string, TQueryParamValue>) => {
  const queryParamObject: Record<string, TQueryParamValue> = {};
  const queryParam = new URLSearchParams();

  Object.entries(queryObject).forEach(([key, value]) => {
    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
      queryParamObject[key] = value;
      queryParam.append(key, value.toString());
    } else if (typeof value === "string" && value.length > 0) {
      queryParamObject[key] = value.split(",");
      queryParam.append(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      queryParamObject[key] = value;
      queryParam.append(key, value.toString());
    }
  });

  return {
    query: queryParamObject,
    queryParam: queryParam.toString(),
  };
};
