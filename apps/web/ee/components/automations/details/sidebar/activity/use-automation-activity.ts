import { useCallback, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
// plane imports
import { EAutomationNodeType, type TAutomationActivityKeys, type TAutomationNodeActivityKeys } from "@plane/types";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TActivityListItemDetails = {
  descriptionContent?: string;
  icon?: LucideIcon;
  titleContent: string;
};

type TArgs = {
  activityId: string;
  automationId: string;
};

export const useAutomationActivity = (args: TArgs) => {
  const { activityId, automationId } = args;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const { activity, getNodeById } = getAutomationById(automationId) ?? {};
  const activityDetails = activity?.getActivityById?.(activityId);

  const getAutomationItemDetails = useCallback((): TActivityListItemDetails | null => {
    if (activityDetails?.verb !== "created") return null;

    return {
      titleContent: "created the automation",
    };
  }, [activityDetails]);

  const getAutomationPropertyItemDetails = useCallback(
    (propertyKey: keyof TAutomationActivityKeys): TActivityListItemDetails | null => {
      if (activityDetails?.verb !== "updated") return null;

      return {
        titleContent: `updated the automation`,
        descriptionContent: `${propertyKey} to ${activityDetails?.new_value}`,
      };
    },
    [activityDetails]
  );

  const getAutomationNodeItemDetails = useCallback((): TActivityListItemDetails | null => {
    let titleContent: string | null = null;
    const node = activityDetails?.automation_node ? getNodeById?.(activityDetails?.automation_node) : undefined;

    switch (activityDetails?.verb) {
      case "created":
        titleContent = `added ${node?.node_type}`;
        break;
      case "updated":
        titleContent = `updated ${node?.node_type}`;
        break;
      case "deleted":
        titleContent = `deleted ${node?.node_type}`;
        break;
      default:
        return null;
    }

    return {
      titleContent,
    };
  }, [activityDetails, getNodeById]);

  const getAutomationNodePropertyItemDetails = useCallback(
    (propertyKey: keyof TAutomationNodeActivityKeys): TActivityListItemDetails | null => {
      if (activityDetails?.verb !== "updated") return null;
      const nodeType = activityDetails?.automation_node
        ? getNodeById?.(activityDetails?.automation_node)?.node_type
        : undefined;

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
        titleContent: `updated ${nodeType}`,
      };
    },
    [activityDetails, getNodeById]
  );

  const activityListItemDetails = useMemo((): TActivityListItemDetails | null => {
    const activityField = activityDetails?.field;

    let activityItemDetails: TActivityListItemDetails | null = null;
    switch (activityField) {
      case "automation":
        activityItemDetails = getAutomationItemDetails();
        break;
      case "automation.name":
      case "automation.description":
      case "automation.scope":
        activityItemDetails = getAutomationPropertyItemDetails(
          activityField.split(".")[1] as keyof TAutomationActivityKeys
        );
        break;
      case "automation.node":
        activityItemDetails = getAutomationNodeItemDetails();
        break;
      case "automation.node.name":
      case "automation.node.config":
      case "automation.node.handler_name":
      case "automation.node.is_enabled":
        activityItemDetails = getAutomationNodePropertyItemDetails(
          activityField.split(".")[2] as keyof TAutomationNodeActivityKeys
        );
        break;
      default:
        activityItemDetails = null;
    }

    return activityItemDetails;
  }, [
    activityDetails,
    getAutomationItemDetails,
    getAutomationNodeItemDetails,
    getAutomationNodePropertyItemDetails,
    getAutomationPropertyItemDetails,
  ]);

  return {
    activityListItemDetails,
  };
};
