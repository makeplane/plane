import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Check, Search, Shapes } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { EditorTitleRefApi, getEditorContentWithReplacedAssets } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { FileService } from "@plane/services";
import { TPageTemplate } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { Button, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SimpleEmptyState } from "@/components/empty-state";
// helpers
// plane web hooks
import { usePageTemplates } from "@/plane-web/hooks/store";
// store
import { IBaseTemplateInstance } from "@/plane-web/store/templates";
import { TPageInstance } from "@/store/pages/base-page";

const fileService = new FileService();

type TTemplateSelectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  page: TPageInstance;
  projectId: string | undefined;
  titleEditorRef: EditorTitleRefApi;
  workspaceSlug: string;
};

export const TemplateSelectModal: React.FC<TTemplateSelectModalProps> = observer((props) => {
  const { isOpen, onClose, page, projectId, titleEditorRef, workspaceSlug } = props;
  // refs
  const applyButtonRef = useRef<HTMLButtonElement>(null);
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAllTemplates, getTemplateById } = usePageTemplates();
  // derived values
  const editorRef = page.editorRef;
  const allPageTemplates = getAllTemplates(workspaceSlug);
  const filteredTemplates = useMemo(
    () =>
      allPageTemplates.filter((template) => {
        const templateQuery = `${template.name} ${template.template_data.name}`.toLowerCase();
        return templateQuery.includes(searchTerm.toLowerCase());
      }),
    [allPageTemplates, searchTerm]
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedTemplateId(null);
    }
  }, [isOpen]);

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !page.id) return;
    const selectedTemplate = getTemplateById(selectedTemplateId);
    if (!selectedTemplate) return;
    setIsApplyingTemplate(true);
    // duplicate template assets and replace the old assets with the new ones
    const duplicateAssetService = fileService.duplicateAssets.bind(fileService, workspaceSlug);
    const documentPayload = await getEditorContentWithReplacedAssets({
      descriptionHTML: selectedTemplate.template_data.description_html ?? "",
      entityId: page.id,
      entityType: EFileAssetType.PAGE_DESCRIPTION,
      projectId,
      variant: "document",
      duplicateAssetService,
    });
    await page.update({
      logo_props: selectedTemplate.template_data.logo_props,
    });
    page.mutateProperties({
      name: selectedTemplate.template_data.name,
    });
    editorRef?.clearEditor();
    editorRef?.setEditorValue(documentPayload.description_html, true);
    titleEditorRef.clearEditor();
    titleEditorRef.setEditorValue(`<p>${selectedTemplate.template_data.name}</p>`, true);
    onClose();
    setIsApplyingTemplate(false);
  };

  const renderEmptyState = useCallback(() => {
    if (allPageTemplates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState
            title={t("templates.empty_state.page.no_templates.title")}
            description={t("templates.empty_state.page.no_templates.description")}
          />
        </div>
      );
    }

    if (filteredTemplates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
          <SimpleEmptyState
            title={t("templates.empty_state.page.no_results.title")}
            description={t("templates.empty_state.page.no_results.description")}
          />
        </div>
      );
    }

    return null;
  }, [allPageTemplates.length, filteredTemplates.length, t]);

  const renderTemplateOption = useCallback(
    (template: IBaseTemplateInstance<TPageTemplate>) => {
      const isTemplateSelected = selectedTemplateId === template.id;
      return (
        <Combobox.Option
          key={template.id}
          value={template.id}
          className={({ active }) =>
            cn(
              "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-custom-text-200 transition-colors",
              {
                "bg-custom-background-80": active,
                "text-custom-text-100": isTemplateSelected,
              }
            )
          }
        >
          <div className="flex items-center gap-2 truncate">
            <span className="flex-shrink-0 size-4 grid place-items-center">
              {isTemplateSelected ? (
                <Check className="size-4 text-custom-text-100" />
              ) : (
                <Shapes className="size-4 text-custom-text-100" />
              )}
            </span>
            <p className="text-sm truncate">{template.name}</p>
          </div>
        </Combobox.Option>
      );
    },
    [selectedTemplateId]
  );

  const renderTemplateList = useCallback(() => {
    const emptyState = renderEmptyState();
    if (emptyState) return emptyState;
    return <ul className="px-2 text-custom-text-100">{filteredTemplates.map(renderTemplateOption)}</ul>;
  }, [filteredTemplates, renderEmptyState, renderTemplateOption]);

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={onClose}>
      <Combobox
        as="div"
        value={selectedTemplateId}
        onChange={(val: string) => {
          if (val === selectedTemplateId) {
            setSelectedTemplateId(null);
          } else {
            setSelectedTemplateId(val);
          }
          setSearchTerm("");
          applyButtonRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 px-4">
          <Search className="flex-shrink-0 size-4 text-custom-text-400" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
            placeholder={t("common.search.placeholder")}
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {renderTemplateList()}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3">
        <Button variant="neutral-primary" size="sm" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          ref={applyButtonRef}
          variant="primary"
          size="sm"
          onClick={handleApplyTemplate}
          loading={isApplyingTemplate}
          disabled={!selectedTemplateId}
        >
          {isApplyingTemplate ? t("common.applying") : t("common.apply")}
        </Button>
      </div>
    </ModalCore>
  );
});
