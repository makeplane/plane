/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { BrandMark } from "@plane/propel/icons";
import { useBrand } from "@/hooks/use-brand";

type TInstanceBrandMarkProps = {
  className?: string;
  variant?: "mark" | "lockup";
};

export const InstanceBrandMark = observer(function InstanceBrandMark(props: TInstanceBrandMarkProps) {
  const { className, variant = "mark" } = props;
  const { name, logoUrl } = useBrand();

  return <BrandMark logoUrl={logoUrl} name={name} className={className} variant={variant} />;
});
