/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Sparkle } from "lucide-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssue } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { Loader } from "@plane/ui";
import { getDescriptionPlaceholderI18n, getTabIndex } from "@plane/utils";
// components
import { GptAssistantPopover } from "@/components/core/modals/gpt-assistant-popover";
import { RichTextEditor } from "@/components/editor/rich-text";
// helpers
// hooks
import { useEditorAsset } from "@/hooks/store/use-editor-asset";
import { useInstance } from "@/hooks/store/use-instance";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import useKeypress from "@/hooks/use-keypress";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web services
import { WorkspaceService } from "@/services/workspace.service";
// services
import { AIService } from "@/services/ai.service";
const workspaceService = new WorkspaceService();
const aiService = new AIService();

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const inferDocumentGuidance = (documentName: string) => {
  const normalized = normalizeText(documentName);
  const has = (terms: string[]) => terms.some((term) => normalized.includes(term));

  const formats = new Set<string>(["PDF"]);
  const annexes = new Set<string>(["Anexos técnicos necesarios para sustento y trazabilidad del documento."]);
  let docType = "Documento técnico de expediente";

  if (has(["plano", "topograf", "arquitect", "estructur", "instalac", "seccion", "perfil"])) {
    docType = "Plano técnico";
    formats.add("DWG");
    annexes.add("Leyenda, escalas, cuadro de coordenadas/puntos de control (si aplica).");
  }
  if (has(["memoria", "informe", "estudio", "especificaciones", "manual", "calculo"])) {
    docType = "Documento técnico narrativo";
    formats.add("DOCX");
    annexes.add("Referencias normativas y criterios técnicos aplicados.");
  }
  if (has(["metrados", "presupuesto", "costos", "valorizacion", "valuacion", "apu"])) {
    docType = "Documento de costos y metrados";
    formats.add("XLSX");
    annexes.add("Cuadros de cálculo, metrados y trazabilidad de partidas.");
  }
  if (has(["cronograma", "programacion", "plan de trabajo"])) {
    docType = "Documento de planificación";
    formats.add("XLSX");
    annexes.add("Ruta crítica, hitos y supuestos de programación.");
  }

  return {
    docType,
    formatList: Array.from(formats).join(", "),
    annexList: Array.from(annexes)
      .map((item) => `- ${item}`)
      .join("\n"),
  };
};

const buildStandardTemplateTask = (documentName: string, projectName?: string) => {
  const safeProjectName = projectName?.trim() ? projectName.trim() : "No especificado";
  const { docType, formatList, annexList } = inferDocumentGuidance(documentName);
  return `Redacta una historia de usuario para gestión documental de expedientes de ingeniería civil.
Genera la salida en español y usa exactamente la plantilla indicada.
Tipo de documento inferido: ${docType}.
Variables de contexto:
- nombre_documento: "${documentName}"
- nombre_proyecto: "${safeProjectName}"
Debes usar las variables en el contenido final, sin mostrar la palabra "variable".
Debes completar todas las secciones con contenido útil, concreto y verificable.
El contenido debe ser coherente con un expediente técnico de obra civil y mantenerse en tono formal.
No uses lenguaje de software ni programación.
No menciones: código, API, backend, frontend, base de datos, deploy, sprint, bug, feature, ticket.
No inventes normativa específica que no esté en el título; usa referencias genéricas como "normativa vigente aplicable".
Mantén cada sección breve y accionable.

PLANTILLA ESTÁNDAR
1. Identificación
Documento / Entregable:
${documentName}

2. Objetivo de la Tarea
Elaborar / Revisar / Subsanar / Aprobar el documento indicado, conforme al alcance del expediente técnico.
En esta sección agrega 2 a 4 líneas específicas del documento detectado con enfoque constructivo.

3. Alcance del Documento

Debe incluir:

- Contenido técnico según normativa vigente aplicable.
- Información técnica específica del tipo de documento.
- Compatibilidad con otras especialidades.
- Formato institucional requerido.
- Anexos recomendados para este documento:
${annexList}

En esta sección agrega puntos concretos verificables para este tipo de documento.

4. Entregable Esperado

Archivo en formato correspondiente (${formatList}).

Documento completo y coherente

Listo para revisión técnica
En esta sección indica claramente:
- Archivo principal.
- Anexos mínimos realmente aplicables al tipo de documento.
- Proyecto asociado: ${safeProjectName}.

5. Criterios de Aceptación
Nº	Condición
1	Documento cumple normativa aplicable
2	Contenido completo según índice del expediente
3	Compatible con demás especialidades
4	Formato correcto
5	Sin observaciones pendientes

No agregues secciones extra fuera de la plantilla.
No incluyas "Flujo de Estado".
No incluyas contenido de programación.`;
};

type TIssueDescriptionEditorProps = {
  control: Control<TIssue>;
  isDraft: boolean;
  issueName: string;
  issueId: string | undefined;
  descriptionHtmlData: string | undefined;
  editorRef: React.MutableRefObject<EditorRefApi | null>;
  submitBtnRef: React.MutableRefObject<HTMLButtonElement | null>;
  gptAssistantModal: boolean;
  workspaceSlug: string;
  projectId: string | null;
  handleFormChange: () => void;
  handleDescriptionHTMLDataChange: (descriptionHtmlData: string) => void;
  setGptAssistantModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleGptAssistantClose: () => void;
  onAssetUpload: (assetId: string) => void;
  onClose: () => void;
};

export const IssueDescriptionEditor = observer(function IssueDescriptionEditor(props: TIssueDescriptionEditorProps) {
  const {
    control,
    isDraft,
    issueName,
    issueId,
    descriptionHtmlData,
    editorRef,
    submitBtnRef,
    gptAssistantModal,
    workspaceSlug,
    projectId,
    handleFormChange,
    handleDescriptionHTMLDataChange,
    setGptAssistantModal,
    handleGptAssistantClose,
    onAssetUpload,
    onClose,
  } = props;
  // i18n
  const { t } = useTranslation();
  // states
  const [iAmFeelingLucky, setIAmFeelingLucky] = useState(false);
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { getProjectById } = useProject();
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString())?.id ?? "";
  const projectName = projectId ? (getProjectById(projectId)?.name ?? "") : "";
  const { config } = useInstance();
  const { uploadEditorAsset, duplicateEditorAsset } = useEditorAsset();
  // platform
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  useEffect(() => {
    if (descriptionHtmlData) handleDescriptionHTMLDataChange(descriptionHtmlData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptionHtmlData]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (editorRef.current?.isEditorReadyToDiscard()) {
      onClose();
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Editor is still processing changes. Please wait before proceeding.",
      });
      event.preventDefault(); // Prevent default action if editor is not ready to discard
    }
  };

  useKeypress("Escape", handleKeyDown);

  // handlers
  const handleAiAssistance = async (response: string) => {
    if (!workspaceSlug || !projectId) return;

    editorRef.current?.setEditorValueAtCursorPosition(response);
  };

  const handleAutoGenerateDescription = async () => {
    if (!workspaceSlug || !projectId) return;

    setIAmFeelingLucky(true);

    aiService
      .createGptTask(workspaceSlug.toString(), {
        prompt: issueName,
        task: buildStandardTemplateTask(issueName.trim(), projectName),
      })
      .then((res) => {
        if (res.response === "")
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message:
              "Work item title isn't informative enough to generate the description. Please try with a different title.",
          });
        else handleAiAssistance(res.response_html);
      })
      .catch((err) => {
        const error = err?.data?.error;

        if (err.status === 429)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "You have reached the maximum number of requests of 50 requests per month per user.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: error || "Some error occurred. Please try again.",
          });
      })
      .finally(() => setIAmFeelingLucky(false));
  };

  return (
    <div className="border-[0.5px] border-subtle-1 bg-layer-2 rounded-lg relative">
      {descriptionHtmlData === undefined || !projectId ? (
        <Loader className="min-h-[120px] max-h-64 space-y-2 overflow-hidden rounded-md border border-subtle p-3 py-2 pt-3">
          <Loader.Item width="100%" height="26px" />
          <div className="flex items-center gap-2">
            <Loader.Item width="26px" height="26px" />
            <Loader.Item width="400px" height="26px" />
          </div>
          <div className="flex items-center gap-2">
            <Loader.Item width="26px" height="26px" />
            <Loader.Item width="400px" height="26px" />
          </div>
          <Loader.Item width="80%" height="26px" />
          <div className="flex items-center gap-2">
            <Loader.Item width="50%" height="26px" />
          </div>
          <div className="border-0.5 absolute bottom-2 right-3.5 z-10 flex items-center gap-2">
            <Loader.Item width="100px" height="26px" />
            <Loader.Item width="50px" height="26px" />
          </div>
        </Loader>
      ) : (
        <>
          <Controller
            name="description_html"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RichTextEditor
                editable
                id="issue-modal-editor"
                initialValue={value ?? ""}
                value={descriptionHtmlData}
                workspaceSlug={workspaceSlug?.toString()}
                workspaceId={workspaceId}
                projectId={projectId}
                onChange={(_description: object, description_html: string) => {
                  onChange(description_html);
                  handleFormChange();
                }}
                onEnterKeyPress={() => submitBtnRef?.current?.click()}
                ref={editorRef}
                tabIndex={getIndex("description_html")}
                placeholder={(isFocused, description) => t(getDescriptionPlaceholderI18n(isFocused, description))}
                searchMentionCallback={async (payload) =>
                  await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
                    ...payload,
                    project_id: projectId?.toString() ?? "",
                  })
                }
                containerClassName="pt-3 min-h-[120px]"
                uploadFile={async (blockId, file) => {
                  try {
                    const { asset_id } = await uploadEditorAsset({
                      blockId,
                      data: {
                        entity_identifier: issueId ?? "",
                        entity_type: isDraft
                          ? EFileAssetType.DRAFT_ISSUE_DESCRIPTION
                          : EFileAssetType.ISSUE_DESCRIPTION,
                      },
                      file,
                      projectId,
                      workspaceSlug,
                    });
                    onAssetUpload(asset_id);
                    return asset_id;
                  } catch (error) {
                    console.log("Error in uploading issue asset:", error);
                    throw new Error("Asset upload failed. Please try again later.");
                  }
                }}
                duplicateFile={async (assetId: string) => {
                  try {
                    const { asset_id } = await duplicateEditorAsset({
                      assetId,
                      entityId: issueId,
                      entityType: isDraft ? EFileAssetType.DRAFT_ISSUE_DESCRIPTION : EFileAssetType.ISSUE_DESCRIPTION,
                      projectId,
                      workspaceSlug,
                    });
                    onAssetUpload(asset_id);
                    return asset_id;
                  } catch {
                    throw new Error("Asset duplication failed. Please try again later.");
                  }
                }}
              />
            )}
          />
          <div className="border-0.5 z-10 flex items-center justify-end gap-2 p-3">
            {issueName && issueName.trim() !== "" && config?.has_llm_configured && (
              <button
                type="button"
                className={`flex items-center gap-1 rounded-sm bg-surface-2 hover:bg-layer-1 px-1.5 py-1 text-caption-sm-regular ${
                  iAmFeelingLucky ? "cursor-wait" : ""
                }`}
                onClick={handleAutoGenerateDescription}
                disabled={iAmFeelingLucky}
                tabIndex={getIndex("feeling_lucky")}
              >
                {iAmFeelingLucky ? (
                  t("generating_response")
                ) : (
                  <>
                    <Sparkle className="h-3.5 w-3.5" />
                    {t("im_feeling_lucky")}
                  </>
                )}
              </button>
            )}
            {config?.has_llm_configured && projectId && (
              <GptAssistantPopover
                isOpen={gptAssistantModal}
                handleClose={() => {
                  setGptAssistantModal((prevData) => !prevData);
                  // this is done so that the title do not reset after gpt popover closed
                  handleGptAssistantClose();
                }}
                onResponse={(response) => {
                  handleAiAssistance(response);
                }}
                placement="top-end"
                button={
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-caption-sm-regular bg-surface-2 hover:bg-layer-1"
                    onClick={() => setGptAssistantModal((prevData) => !prevData)}
                    tabIndex={-1}
                  >
                    <Sparkle className="h-4 w-4" />
                    AI
                  </button>
                }
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
});
