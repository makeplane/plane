import posthog from "posthog-js";

export type TEventState = "SUCCESS" | "ERROR";

export type TTrackingElement =
  | "HEADER_BUTTON"
  | "SIDEBAR_BUTTON"
  | "EMPTY_STATE_BUTTON"
  | "COMMAND_PALETTE_ITEM"
  | "MODAL_BUTTON"
  | "DROPDOWN_ITEM"
  | "LIST_ITEM_BUTTON"
  | "CARD_BUTTON"
  | "TAB_BUTTON"
  | "MENU_ITEM"
  | "SEARCH_BAR"
  | "FILTER_BUTTON";

export type TEventName =
  | "workspace_created"
  | "workspace_updated"
  | "workspace_deleted"
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "cycle_created"
  | "cycle_updated"
  | "cycle_deleted"
  | "module_created"
  | "module_updated"
  | "module_deleted"
  | "issue_created"
  | "issue_updated"
  | "issue_deleted";

export type TElementContext = Record<string, any>;
export type TEventContext = Record<string, any>;
export type TInteractionType = "clicked" | "viewed" | "hovered";

/**
 * Track UI element interactions (clicks, hovers, views, etc.)
 * This helps understand user behavior and interaction patterns
 *
 * @param element - Generic UI element type
 * @param context - Context about where and why the interaction happened
 */
export const trackElement = (
  element: TTrackingElement,
  interaction_type: TInteractionType,
  context?: TElementContext
) => {
  if (!posthog) return;

  const elementEvent = `${element}_${interaction_type}` ?? "element_interacted";

  const payload = {
    element_type: element,
    timestamp: new Date().toISOString(),
    ...context,
  };

  posthog.capture(elementEvent, payload);
};

/**
 * Track click events
 * @param element - The element that was clicked
 * @param context - Additional context
 */
export const trackClick = (element: TTrackingElement, context?: TElementContext) => {
  trackElement(element, "clicked", { ...context });
};

/**
 * Track view events
 * @param element - The element that was viewed
 * @param context - Additional context
 */
export const trackView = (element: TTrackingElement, context?: TElementContext) => {
  trackElement(element, "viewed", { ...context });
};

/**
 * Track hover events
 * @param element - The element that was hovered
 * @param context - Additional context
 */
export const trackHover = (element: TTrackingElement, context?: TElementContext) => {
  trackElement(element, "hovered", { ...context });
};

/**
 * Track business events (outcomes, state changes, etc.)
 * This helps understand business metrics and conversion rates
 *
 * @param eventName - Business event name (e.g., "cycle_created", "project_updated")
 * @param state - Success or error state
 * @param payload - Event-specific data
 * @param context - Additional context
 */
export const trackEvent = (
  eventName: TEventName,
  state: TEventState,
  payload?: Record<string, any>,
  context?: TEventContext
) => {
  if (!posthog) return;

  const finalPayload = {
    ...context,
    ...payload,
    state,
    timestamp: new Date().toISOString(),
  };

  posthog.capture(eventName, finalPayload);
};

/**
 * Track success events
 * @param eventName - The name of the event
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const trackSuccess = (eventName: TEventName, payload?: Record<string, any>, context?: TEventContext) => {
  trackEvent(eventName, "SUCCESS", payload, context);
};

/**
 * Track error events
 * @param eventName - The name of the event
 * @param error - The error object
 * @param payload - Additional payload
 * @param context - Additional context
 */
export const trackError = (
  eventName: TEventName,
  error?: Error | string,
  payload?: Record<string, any>,
  context?: TEventContext
) => {
  trackEvent(
    eventName,
    "ERROR",
    {
      ...payload,
      error: typeof error === "string" ? error : error?.message,
    },
    context
  );
};

/**
 * Track both element interaction and business event together
 * @param element - The element that was interacted with
 * @param elementContext - Additional context for the element
 * @param eventName - The name of the event
 * @param eventState - The state of the event
 * @param eventPayload - Additional payload for the event
 * @param eventContext - Additional context for the event
 */
export const trackElementAndEvent = (
  element: TTrackingElement,
  elementContext: TElementContext,
  eventName: TEventName,
  eventState: TEventState,
  eventPayload?: Record<string, any>,
  eventContext?: TEventContext
) => {
  // Track the element interaction first
  trackElement(element, "clicked", elementContext);

  // Then track the business event
  trackEvent(eventName, eventState, eventPayload, eventContext);
};
