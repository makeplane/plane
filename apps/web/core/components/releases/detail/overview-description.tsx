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

import { useState } from "react";
import { observer } from "mobx-react";
import { EFileAssetType } from "@plane/types";
import type { JSONContent, Release } from "@plane/types";
import { SectionWrapper } from "@/components/common/layout/main/common/section-wrapper";
import { DescriptionInput } from "@/components/editor/rich-text/description-input";

type Props = {
  release: Release;
  workspaceSlug: string;
  disabled?: boolean;
  onUpdate: (html: string, json?: JSONContent) => Promise<void>;
};

export const ReleaseOverviewDescription = observer(function ReleaseOverviewDescription(props: Props) {
  const { release, workspaceSlug, disabled = false, onUpdate } = props;
  const [_isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");

  const descriptionHtml = release.description?.description_html || "<p></p>";

  return (
    <SectionWrapper>
      <DescriptionInput
        containerClassName="px-0 w-full"
        disabled={disabled}
        entityId={release.id}
        fileAssetType={EFileAssetType.RELEASE_DESCRIPTION}
        initialValue={descriptionHtml}
        key={release.id}
        onSubmit={async (value) => {
          await onUpdate(value.description_html, value.description_json as JSONContent);
        }}
        setIsSubmitting={setIsSubmitting}
        workspaceSlug={workspaceSlug}
      />
    </SectionWrapper>
  );
});
