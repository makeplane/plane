import { useState } from "react";
import { observer } from "mobx-react";
import { Shapes } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// ce imports
import { PageTemplatePicker as PageTemplatePickerCE, TPageTemplatePickerProps } from "@/ce/components/pages/editor";
// plane web imports
import { TemplateSelectModal } from "@/plane-web/components/pages/modals";
import { useFlag } from "@/plane-web/hooks/store";

export const PageTemplatePicker: React.FC<TPageTemplatePickerProps> = observer((props) => {
  const { isPageLoading, page, projectId, titleEditorRef, workspaceSlug } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  // derived values
  const isPageTemplatesFeatureEnabled = useFlag(workspaceSlug, "PAGE_TEMPLATES");
  const { isContentEditable, editorRef } = page;

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
          className="flex items-center gap-1 p-1 rounded font-medium text-sm hover:bg-custom-background-80 text-custom-text-300 outline-none transition-colors"
        >
          <Shapes className="flex-shrink-0 size-4" />
          {t("templates.dropdown.label.page")}
        </button>
      </div>
    </>
  );
});
