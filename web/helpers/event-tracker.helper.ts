import posthog from "posthog-js";
import { TTrackingElement } from "@plane/constants";

export type TEventState = "SUCCESS" | "ERROR";
export type TElementContext = Record<string, any>;
export type TEventContext = Record<string, any>;
export type TInteractionType = "clicked" | "viewed" | "hovered";

type TTrackElementParams = {
  elementName: TTrackingElement;
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
const captureElement = (params: TTrackElementParams) => {
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

type TTrackClickParams = Omit<TTrackElementParams, "interaction_type">;
/**
 * Capture click events
 * @param element - The element that was clicked
 * @param context - Additional context
 */
export const captureClick = (params: TTrackClickParams) => {
  captureElement({ ...params, interaction_type: "clicked" });
};

type TTrackViewParams = Omit<TTrackElementParams, "interaction_type">;
/**
 * Capture view events
 * @param element - The element that was viewed
 * @param context - Additional context
 */
export const captureView = (params: TTrackViewParams) => {
  captureElement({ ...params, interaction_type: "viewed" });
};

type TTrackHoverParams = Omit<TTrackElementParams, "interaction_type">;
/**
 * Capture hover events
 * @param element - The element that was hovered
 * @param context - Additional context
 */
export const captureHover = (params: TTrackHoverParams) => {
  captureElement({ ...params, interaction_type: "hovered" });
};

type TTrackEventParams = {
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
const captureEvent = (params: TTrackEventParams) => {
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

type TTrackSuccessParams = Omit<TTrackEventParams, "state">;
/**
 * Capture success events
 * @param eventName - The name of the event
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const captureSuccess = (params: TTrackSuccessParams) => {
  captureEvent({ ...params, state: "SUCCESS" });
};

type TTrackErrorParams = Omit<TTrackEventParams, "state"> & {
  error: Error | string;
};

/**
 * Capture error events
 * @param eventName - The name of the event
 * @param error - The error object
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const captureError = (params: TTrackErrorParams) => {
  captureEvent({ ...params, state: "ERROR", payload: { ...params.payload, error: params.error } });
};

type TTrackElementAndEventParams = {
  element: Omit<TTrackElementParams, "interaction_type">;
  event: TTrackEventParams;
};

/**
 * Capture both element interaction and business event together
 * @param element - The element that was interacted with
 * @param event - The business event that was triggered
 */
export const captureElementAndEvent = (params: TTrackElementAndEventParams) => {
  const { element, event } = params;
  // Capture the element interaction first
  captureElement({ ...element, interaction_type: "clicked" });

  // Then capture the business event
  captureEvent(event);
};
