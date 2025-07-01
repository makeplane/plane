import posthog from "posthog-js";

export type TEventState = "SUCCESS" | "ERROR";
export type TElementContext = Record<string, any>;
export type TEventContext = Record<string, any>;
export type TInteractionType = "clicked" | "viewed" | "hovered";

/**
 * Join a event group in PostHog
 * @param groupName - The name of the group
 * @param groupId - The ID of the group
 * @param properties - The properties of the group
 */
export const joinEventGroup = (groupName: string, groupId: string, properties: Record<string, any>) => {
  posthog?.group(groupName, groupId, properties);
};

type TCaptureElementParams = {
  elementName: string;
  interaction_type: TInteractionType;
  context?: TElementContext;
};

/**
 * Capture UI element interactions (clicks, hovers, views, etc.)
 * This helps understand user behavior and interaction patterns
 *
 * @param element - Generic UI element type
 * @param context - Context about where and why the interaction happened
 */
const captureElement = (params: TCaptureElementParams) => {
  const { elementName, interaction_type, context } = params;
  if (!posthog) return;

  const elementEvent = `${elementName}_${interaction_type}`;

  const payload = {
    element_type: elementName,
    timestamp: new Date().toISOString(),
    ...context,
  };

  posthog.capture(elementEvent, payload);
};

type TCaptureClickParams = Omit<TCaptureElementParams, "interaction_type">;
/**
 * Capture click events
 * @param element - The element that was clicked
 * @param context - Additional context
 */
export const captureClick = (params: TCaptureClickParams) => {
  captureElement({ ...params, interaction_type: "clicked" });
};

type TCaptureViewParams = Omit<TCaptureElementParams, "interaction_type">;
/**
 * Capture view events
 * @param element - The element that was viewed
 * @param context - Additional context
 */
export const captureView = (params: TCaptureViewParams) => {
  captureElement({ ...params, interaction_type: "viewed" });
};

type TCaptureHoverParams = Omit<TCaptureElementParams, "interaction_type">;
/**
 * Capture hover events
 * @param element - The element that was hovered
 * @param context - Additional context
 */
export const captureHover = (params: TCaptureHoverParams) => {
  captureElement({ ...params, interaction_type: "hovered" });
};

type TCaptureEventParams = {
  eventName: string;
  payload?: Record<string, any>;
  context?: TEventContext;
  state: TEventState;
};
/**
 * Capture business events (outcomes, state changes, etc.)
 * This helps understand business metrics and conversion rates
 *
 * @param eventName - Business event name (e.g., "cycle_created", "project_updated")
 * @param state - Success or error state
 * @param payload - Event-specific data
 * @param context - Additional context
 */
const captureEvent = (params: TCaptureEventParams) => {
  const { eventName, payload, context, state } = params;
  if (!posthog) return;

  const finalPayload = {
    ...context,
    ...payload,
    state,
    timestamp: new Date().toISOString(),
  };

  posthog.capture(eventName, finalPayload);
};

type TCaptureSuccessParams = Omit<TCaptureEventParams, "state">;
/**
 * Capture success events
 * @param eventName - The name of the event
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const captureSuccess = (params: TCaptureSuccessParams) => {
  captureEvent({ ...params, state: "SUCCESS" });
};

type TCaptureErrorParams = Omit<TCaptureEventParams, "state"> & {
  error?: Error | string;
};
/**
 * Capture error events
 * @param eventName - The name of the event
 * @param error - The error object
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const captureError = (params: TCaptureErrorParams) => {
  captureEvent({ ...params, state: "ERROR", payload: { ...params.payload, error: params.error } });
};

type TCaptureElementAndEventParams = {
  element: Omit<TCaptureElementParams, "interaction_type">;
  event: TCaptureEventParams;
};
/**
 * Capture both element interaction and business event together
 * @param element - The element that was interacted with
 * @param event - The business event that was triggered
 */
export const captureElementAndEvent = (params: TCaptureElementAndEventParams) => {
  const { element, event } = params;
  // Capture the element interaction first
  captureElement({ ...element, interaction_type: "clicked" });

  // Then capture the business event
  captureEvent(event);
};
