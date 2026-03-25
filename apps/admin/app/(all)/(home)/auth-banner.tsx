/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Info } from "lucide-react";
// plane constants
import type { TAdminAuthErrorInfo } from "@plane/constants";
// icons
import { CloseIcon } from "@plane/propel/icons";

type TAuthBanner = {
  bannerData: TAdminAuthErrorInfo | undefined;
  handleBannerData?: (bannerData: TAdminAuthErrorInfo | undefined) => void;
};

export function AuthBanner(props: TAuthBanner) {
  const { bannerData, handleBannerData } = props;

  if (!bannerData) return <></>;
  return (
    <div className="relative flex items-center gap-2 rounded-md border border-accent-strong/50 bg-accent-primary/10 p-2">
      <div className="relative flex h-4 w-4 flex-shrink-0 items-center justify-center">
        <Info size={16} className="text-accent-primary" />
      </div>
      <div className="w-full text-13 font-medium text-accent-primary">{bannerData?.message}</div>
      <div
        className="relative ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-xs text-accent-primary transition-all hover:bg-accent-primary/20"
        onClick={() => handleBannerData && handleBannerData(undefined)}
      >
        <CloseIcon className="h-4 w-4 flex-shrink-0" />
      </div>
    </div>
  );
}
