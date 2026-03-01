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
import { Shapes } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ce imports
import type { TPageTemplatePickerProps } from "@/ce/components/pages/editor";
import { PageTemplatePicker as PageTemplatePickerCE } from "@/ce/components/pages/editor";
// plane web imports
import { TemplateSelectModal } from "@/plane-web/components/pages/modals";
import { useFlag } from "@/plane-web/hooks/store";

export const PageTemplatePicker = observer(function PageTemplatePicker(props: TPageTemplatePickerProps) {
  const { isPageLoading, page, projectId, titleEditorRef, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  // derived values
  const isPageTemplatesFeatureEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  const {
    isContentEditable,
    editor: { editorRef },
  } = page;

  if (!isPageTemplatesFeatureEnabled) return <PageTemplatePickerCE {...props} />;

  if (!isContentEditable || !editorRef || !titleEditorRef.current || isPageLoading) return null;

  return (
    <>
      <TemplateSelectModal
        titleEditorRef={titleEditorRef.current}
        isOpen={isApplyTemplateModalOpen}
        onClose={() => setIsApplyTemplateModalOpen(false)}
        page={page}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      />
      <div className="flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsApplyTemplateModalOpen(true)}
          className="flex items-center gap-1 p-1 rounded-sm font-medium text-13 hover:bg-layer-1 text-tertiary outline-none transition-colors"
        >
          <Shapes className="flex-shrink-0 size-4" />
          {t("templates.dropdown.label.page")}
        </button>
      </div>
    </>
  );
});
