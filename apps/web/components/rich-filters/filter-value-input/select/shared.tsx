/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TSupportedFilterFieldConfigs, IFilterOption, TFilterValue } from "@plane/types";

type TLoadOptionsProps<V extends TFilterValue> = {
  config: TSupportedFilterFieldConfigs<V>;
  setOptions: (options: IFilterOption<V>[]) => void;
  setLoading?: (loading: boolean) => void;
};

export const loadOptions = async <V extends TFilterValue>(props: TLoadOptionsProps<V>) => {
  const { config, setOptions, setLoading } = props;

  // if the config has a getOptions function, load the options
  if ("getOptions" in config && typeof config.getOptions === "function") {
    setLoading?.(true);
    try {
      const result = await config.getOptions();
      setOptions(result);
    } catch (error) {
      console.error("Failed to load options:", error);
    } finally {
      setLoading?.(false);
    }
  }
};
