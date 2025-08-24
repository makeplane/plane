import { Layers3 } from "lucide-react";
// components
import { SelectPlaneProject, ConfigureFlatfile } from "@/plane-web/components/importers/flatfile";
// plane web types
import { E_IMPORTER_STEPS, TImporterStep } from "@/plane-web/types/importers/flatfile";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "flatfile_importer.steps.title_configure_plane",
    i18n_description: "flatfile_importer.steps.description_configure_plane",
    component: () => <SelectPlaneProject />,
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_FLATFILE,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_FLATFILE,
    icon: () => <Layers3 size={14} />,
    i18n_title: "flatfile_importer.steps.title_configure_csv",
    i18n_description: "flatfile_importer.steps.description_configure_csv",
    component: () => <ConfigureFlatfile />,
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: undefined,
  },
];
