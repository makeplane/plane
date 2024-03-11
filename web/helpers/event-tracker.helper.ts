import posthog from "posthog-js";

export const trackEvent = (eventName: string, payload: object | [] | null = null) => {
  try {
    posthog?.capture(eventName, {
      ...payload,
    });
  } catch (error) {
    console.log(error);
  }
};
