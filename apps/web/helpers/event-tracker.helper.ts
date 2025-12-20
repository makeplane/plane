// PostHog analytics stubs for self-hosted government deployment
// All tracking functions are no-ops

export type TEventState = "SUCCESS" | "ERROR";
export type TElementContext = Record<string, unknown>;
export type TEventContext = Record<string, unknown>;
export type TInteractionType = "clicked" | "viewed" | "hovered";

export const joinEventGroup = (_groupName: string, _groupId: string, _properties: Record<string, unknown>) => {};

type TCaptureClickParams = {
  elementName: string;
  context?: TElementContext;
};
export const captureClick = (_params: TCaptureClickParams) => {};

type TCaptureViewParams = {
  elementName: string;
  context?: TElementContext;
};
export const captureView = (_params: TCaptureViewParams) => {};

type TCaptureHoverParams = {
  elementName: string;
  context?: TElementContext;
};
export const captureHover = (_params: TCaptureHoverParams) => {};

type TCaptureSuccessParams = {
  eventName: string;
  payload?: Record<string, unknown>;
  context?: TEventContext;
};
export const captureSuccess = (_params: TCaptureSuccessParams) => {};

type TCaptureErrorParams = {
  eventName: string;
  payload?: Record<string, unknown>;
  context?: TEventContext;
  error?: Error | string;
};
export const captureError = (_params: TCaptureErrorParams) => {};

type TCaptureElementAndEventParams = {
  element: { elementName: string; context?: TElementContext };
  event: { eventName: string; payload?: Record<string, unknown>; context?: TEventContext; state: TEventState };
};
export const captureElementAndEvent = (_params: TCaptureElementAndEventParams) => {};
