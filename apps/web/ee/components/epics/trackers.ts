// plane imports
import { EPIC_TRACKER_ELEMENTS, EPIC_TRACKER_EVENTS } from "@plane/constants";
// local imports
import { captureElementAndEvent, captureError, captureSuccess } from "@/helpers/event-tracker.helper";

type ToggleType = "enable" | "disable";

export const epicsTrackers = (workspaceSlug: string, projectId: string) => {
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
