import posthog from "posthog-js";

export const trackEvent = (eventName: string, payload: object | [] | null = null) => {
  try {
    console.log(eventName);
    posthog?.capture(eventName, {
      ...payload,
    });
    console.log(payload);
  } catch (error) {
    console.log(error);
  }
};
