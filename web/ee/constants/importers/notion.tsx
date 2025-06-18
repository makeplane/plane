import { Layers3 } from "lucide-react";
// components
import { UploadZip } from "@/plane-web/components/importers/notion";
// plane web types
import { E_IMPORTER_STEPS, TImporterStep } from "@/plane-web/types/importers/notion";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.UPLOAD_ZIP,
    icon: () => <Layers3 size={14} />,
    i18n_title: "notion_importer.steps.title_upload_zip",
    i18n_description: "notion_importer.steps.description_upload_zip",
    component: () => <UploadZip />,
    prevStep: undefined,
    nextStep: undefined,
  },
];
