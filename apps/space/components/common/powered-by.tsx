/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { InstanceBrandMark } from "@/components/brand/instance-brand-mark";
import { useBrand } from "@/hooks/use-brand";

type TPoweredBy = {
  disabled?: boolean;
};

export const PoweredBy = observer(function PoweredBy(props: TPoweredBy) {
  const { disabled = false } = props;
  const { websiteUrl, hidePlaneMarketing, name } = useBrand();

  if (disabled || hidePlaneMarketing || !websiteUrl) return null;

  return (
    <a
      href={websiteUrl}
      className="fixed right-5 bottom-2.5 !z-[999999] flex items-center gap-1 rounded-sm border border-subtle bg-layer-3 px-2 py-1 shadow-raised-100"
      target="_blank"
      rel="noreferrer noopener"
    >
      <InstanceBrandMark className="h-3 w-auto text-primary" />
      <div className="text-11">
        Powered by <span className="font-semibold">{name}</span>
      </div>
    </a>
  );
});
