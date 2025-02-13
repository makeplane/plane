import { Layers2, Layers3, ReceiptText, SignalHigh } from "lucide-react";
// components
import {
  SelectPlaneProjectRoot,
  ConfigureAsanaRoot,
  MapStatesRoot,
  SummaryRoot,
  MapPriorityRoot,
} from "@/plane-web/components/importers/asana";
// plane web types
import { E_IMPORTER_STEPS, TImporterStep } from "@/plane-web/types/importers/asana";

export const IMPORTER_STEPS: TImporterStep[] = [
  {
    key: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    icon: () => <Layers3 size={14} />,
    i18n_title: "asana_importer.steps.title_configure_plane",
    i18n_description: "asana_importer.steps.description_configure_plane",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_ASANA,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_ASANA,
    icon: () => <Layers2 size={14} />,
    i18n_title: "asana_importer.steps.title_configure_asana",
    i18n_description: "asana_importer.steps.description_configure_asana",
    component: () => <ConfigureAsanaRoot />,
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    i18n_title: "asana_importer.steps.title_map_states",
    i18n_description: "asana_importer.steps.description_map_states",
    component: () => <MapStatesRoot />,
    prevStep: E_IMPORTER_STEPS.CONFIGURE_ASANA,
    nextStep: E_IMPORTER_STEPS.MAP_PRIORITY,
  },
  {
    key: E_IMPORTER_STEPS.MAP_PRIORITY,
    icon: () => <SignalHigh size={14} />,
    i18n_title: "asana_importer.steps.title_map_priorities",
    i18n_description:"asana_importer.steps.description_map_priorities",
    component: () => <MapPriorityRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    i18n_title: "asana_importer.steps.title_summary",
    i18n_description: "asana_importer.steps.description_summary",
    component: () => <SummaryRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_PRIORITY,
    nextStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
