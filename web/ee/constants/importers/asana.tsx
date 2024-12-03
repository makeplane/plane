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
    title: "Configure Plane",
    description:
      "Please first create the project in Plane where you intend to migrate your Asana data. Once the project is created, select it here.",
    component: () => <SelectPlaneProjectRoot />,
    prevStep: undefined,
    nextStep: E_IMPORTER_STEPS.CONFIGURE_ASANA,
  },
  {
    key: E_IMPORTER_STEPS.CONFIGURE_ASANA,
    icon: () => <Layers2 size={14} />,
    title: "Configure Asana",
    description: "Please select the Asana workspace and project from which you want to migrate your data.",
    component: () => <ConfigureAsanaRoot />,
    prevStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
    nextStep: E_IMPORTER_STEPS.MAP_STATES,
  },
  {
    key: E_IMPORTER_STEPS.MAP_STATES,
    icon: () => <Layers3 size={14} />,
    title: "Map states",
    description:
      "We have automatically matched the Asana statuses to Plane states to the best of our ability. Please map any remaining states before proceeding, you can also create states and map them manually.",
    component: () => <MapStatesRoot />,
    prevStep: E_IMPORTER_STEPS.CONFIGURE_ASANA,
    nextStep: E_IMPORTER_STEPS.MAP_PRIORITY,
  },
  {
    key: E_IMPORTER_STEPS.MAP_PRIORITY,
    icon: () => <SignalHigh size={14} />,
    title: "Map priorities",
    description:
      "We have automatically matched the priorities to the best of our ability. Please map any remaining priorities before proceeding.",
    component: () => <MapPriorityRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_STATES,
    nextStep: E_IMPORTER_STEPS.SUMMARY,
  },
  {
    key: E_IMPORTER_STEPS.SUMMARY,
    icon: () => <ReceiptText size={14} />,
    title: "Summary",
    description: "Here is a summary of the data that will be migrated from Asana to Plane.",
    component: () => <SummaryRoot />,
    prevStep: E_IMPORTER_STEPS.MAP_PRIORITY,
    nextStep: E_IMPORTER_STEPS.SELECT_PLANE_PROJECT,
  },
];
