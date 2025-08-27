// plane imports
import {
  EPIC_PROPERTIES_TRACKER_ELEMENTS,
  EPIC_PROPERTIES_TRACKER_EVENTS,
  EPIC_TRACKER_ELEMENTS,
  EPIC_TRACKER_EVENTS,
} from "@plane/constants";
// local imports
import { captureElementAndEvent, captureError, captureSuccess } from "@/helpers/event-tracker.helper";

type ToggleType = "enable" | "disable";
type PropertyOperationAction = "create" | "update" | "delete";

const propertyOperationActionMap: Record<PropertyOperationAction, string> = {
  create: EPIC_PROPERTIES_TRACKER_EVENTS.create,
  update: EPIC_PROPERTIES_TRACKER_EVENTS.update,
  delete: EPIC_PROPERTIES_TRACKER_EVENTS.delete,
};

type BaseTrackerProps = {
  workspaceSlug?: string;
  projectId?: string;
};

export const epicsTrackers = ({ workspaceSlug, projectId }: BaseTrackerProps) => {
  // common payload
  const commonPayload = {
    workspace_slug: workspaceSlug,
    project_id: projectId,
  };

  return {
    toggleEpicsClicked: () => {
      captureElementAndEvent({
        element: {
          elementName: EPIC_TRACKER_ELEMENTS.TOGGLE_EPICS_BUTTON,
        },
        event: {
          eventName: EPIC_TRACKER_EVENTS.toggle,
          payload: {
            ...commonPayload,
          },
          state: "SUCCESS",
        },
      });
    },

    toggleEpicsSuccess: (toggleType: ToggleType) => {
      captureSuccess({
        eventName: toggleType === "enable" ? EPIC_TRACKER_EVENTS.enable : EPIC_TRACKER_EVENTS.disable,
        payload: {
          ...commonPayload,
        },
      });
    },

    toggleEpicsError: (toggleType: ToggleType) => {
      captureError({
        eventName: toggleType === "enable" ? EPIC_TRACKER_EVENTS.enable : EPIC_TRACKER_EVENTS.disable,
        payload: {
          ...commonPayload,
        },
      });
    },
  };
};

export const epicsPropertiesTrackers = ({ workspaceSlug, projectId }: BaseTrackerProps) => {
  // common payload
  const commonPayload = {
    workspace_slug: workspaceSlug,
    project_id: projectId,
  };

  return {
    epicPropertyOperation: (action: PropertyOperationAction, propertyId?: string, isActive?: boolean) => {
      captureElementAndEvent({
        element: {
          elementName: EPIC_PROPERTIES_TRACKER_ELEMENTS.ACTION_BUTTON,
        },
        event: {
          eventName: propertyOperationActionMap[action],
          payload: {
            ...commonPayload,
            property_id: propertyId,
            is_active: isActive,
          },
          state: "SUCCESS",
        },
      });
    },

    epicPropertyOperationSuccess: (action: PropertyOperationAction, propertyId?: string) => {
      captureSuccess({
        eventName: propertyOperationActionMap[action],
        payload: {
          ...commonPayload,
          property_id: propertyId,
        },
      });
    },

    epicPropertyOperationError: (action: PropertyOperationAction, error?: Error, propertyId?: string) => {
      captureError({
        error: error?.message,
        eventName: propertyOperationActionMap[action],
        payload: {
          ...commonPayload,
          error: error?.message,
          property_id: propertyId,
        },
      });
    },
  };
};
