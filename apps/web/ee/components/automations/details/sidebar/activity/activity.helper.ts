import { Filter, Repeat, Workflow, Zap, type LucideIcon } from "lucide-react";
// plane imports
import {
  EAutomationNodeType,
  TAutomationActivity,
  type TAutomationActivityKeys,
  type TAutomationNodeActivityKeys,
} from "@plane/types";

type TActivityListItemDetails = {
  descriptionContent?: string;
  icon?: LucideIcon;
  titleContent: string;
};

type TArgs = {
  activityId: string;
  automationId: string;
};

const getNodeIcon = (nodeType: EAutomationNodeType): LucideIcon => {
  switch (nodeType) {
    case EAutomationNodeType.TRIGGER:
      return Zap;
    case EAutomationNodeType.CONDITION:
      return Filter;
    case EAutomationNodeType.ACTION:
      return Workflow;
    default:
      return Repeat;
  }
};

const getAutomationItemDetails = (activityDetails: TAutomationActivity): TActivityListItemDetails | null => {
  if (activityDetails?.verb !== "created") return null;

  return {
    titleContent: "created the automation",
  };
};

const getAutomationPropertyItemDetails = (
  activityDetails: TAutomationActivity,
  propertyKey: keyof TAutomationActivityKeys
): TActivityListItemDetails | null => {
  if (activityDetails?.verb !== "updated") return null;

  return {
    titleContent: `updated the automation`,
    descriptionContent: `${propertyKey} to ${activityDetails?.new_value}`,
  };
};

const getAutomationNodeItemDetails = (
  activityDetails: TAutomationActivity,
  nodeType: EAutomationNodeType
): TActivityListItemDetails | null => {
  let titleContent: string | null = null;

  switch (activityDetails?.verb) {
    case "created":
      titleContent = `added ${nodeType}`;
      break;
    case "updated":
      titleContent = `updated ${nodeType}`;
      break;
    case "deleted":
      titleContent = `deleted ${nodeType}`;
      break;
    default:
      return null;
  }

  return {
    icon: getNodeIcon(nodeType),
    titleContent,
  };
};

const getAutomationNodePropertyItemDetails = (
  activityDetails: TAutomationActivity,
  nodeType: EAutomationNodeType,
  propertyKey: keyof TAutomationNodeActivityKeys
): TActivityListItemDetails | null => {
  if (activityDetails?.verb !== "updated") return null;

  let descriptionContent: string | undefined = undefined;

  switch (nodeType) {
    case EAutomationNodeType.CONDITION:
      descriptionContent = propertyKey === "config" ? "filter was changed" : undefined;
      break;
    case EAutomationNodeType.TRIGGER:
      descriptionContent = propertyKey === "handler_name" ? "handler was changed" : undefined;
      break;
    default:
      descriptionContent = undefined;
  }

  return {
    descriptionContent,
    icon: getNodeIcon(nodeType),
    titleContent: `updated ${nodeType}`,
  };
};

export const getAutomationActivityListItemDetails = (
  activityDetails: TAutomationActivity
): TActivityListItemDetails | null => {
  const activityField = activityDetails?.field;
  const activityFieldParts = activityField?.split(".");

  if (!activityField || !activityFieldParts) return null;

  let activityItemDetails: TActivityListItemDetails | null = null;

  if (activityField === "automation") {
    activityItemDetails = getAutomationItemDetails(activityDetails);
  } else if (activityFieldParts.length === 2 && (activityFieldParts[1] as keyof TAutomationActivityKeys)) {
    activityItemDetails = getAutomationPropertyItemDetails(
      activityDetails,
      activityFieldParts[1] as keyof TAutomationActivityKeys
    );
  } else if (activityFieldParts.length === 3 && (activityFieldParts[2] as EAutomationNodeType)) {
    activityItemDetails = getAutomationNodeItemDetails(activityDetails, activityFieldParts[2] as EAutomationNodeType);
  } else if (
    activityFieldParts.length === 4 &&
    (activityFieldParts[2] as EAutomationNodeType) &&
    (activityFieldParts[3] as keyof TAutomationNodeActivityKeys)
  ) {
    activityItemDetails = getAutomationNodePropertyItemDetails(
      activityDetails,
      activityFieldParts[2] as EAutomationNodeType,
      activityFieldParts[3] as keyof TAutomationNodeActivityKeys
    );
  }

  return activityItemDetails;
};
