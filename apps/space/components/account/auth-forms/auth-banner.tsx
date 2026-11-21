/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Banner } from "@makeplane/propel/components/banner";
// helpers
import type { TAuthErrorInfo } from "@/helpers/authentication.helper";

type TAuthBanner = {
  bannerData: TAuthErrorInfo | undefined;
  handleBannerData?: (bannerData: TAuthErrorInfo | undefined) => void;
};

export function AuthBanner(props: TAuthBanner) {
  const { bannerData, handleBannerData } = props;

  if (!bannerData) return <></>;
  return (
    <Banner
      placement="inline"
      variant="info"
      description={bannerData.message}
      onDismiss={() => handleBannerData?.(undefined)}
    />
  );
}
