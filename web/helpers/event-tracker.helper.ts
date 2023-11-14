import posthog from "posthog-js";

export const eventTracker = (eventName: string, payload: object | [] | null, id: string | null) => {
  try {
    posthog.capture(eventName, {
      ...payload,
      id: id,
    });
  } catch (error) {
    console.log(error);
  }
};
