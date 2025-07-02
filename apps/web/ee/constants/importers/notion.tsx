import { Layers3 } from "lucide-react";
// components
import { UploadZip } from "@/plane-web/components/importers/zip-importer";
// plane web types
import { E_IMPORTER_STEPS, EZipDriverType, TImporterStep } from "@/plane-web/types/importers/zip-importer";
import ConfluenceLogo from "@/public/services/confluence.svg";
import NotionLogo from "@/public/services/notion.svg";

export const NOTION_IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.UPLOAD_ZIP,
    icon: () => <Layers3 size={14} />,
    i18n_title: "notion_importer.steps.title_upload_zip",
    i18n_description: "notion_importer.steps.description_upload_zip",
    component: () => <UploadZip driverType={EZipDriverType.NOTION} logo={NotionLogo} serviceName="Notion" />,
    prevStep: undefined,
    nextStep: undefined,
  },
];

export const CONFLUENCE_IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.UPLOAD_ZIP,
    icon: () => <Layers3 size={14} />,
    i18n_title: "confluence_importer.steps.title_upload_zip",
    i18n_description: "confluence_importer.steps.description_upload_zip",
    component: () => (
      <UploadZip driverType={EZipDriverType.CONFLUENCE} logo={ConfluenceLogo} serviceName="Confluence" />
    ),
    prevStep: undefined,
    nextStep: undefined,
  },
];
