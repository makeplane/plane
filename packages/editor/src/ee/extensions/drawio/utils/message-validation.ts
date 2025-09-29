// Message validation utilities for drawio iframe communication

// Allowed origins for drawio messages
const ALLOWED_ORIGINS = ["https://embed.diagrams.net", "https://www.draw.io", "https://app.diagrams.net"];

// Expected message event types from drawio
const VALID_DRAWIO_EVENTS = ["init", "save", "export", "exit", "configure", "load"] as const;

export type ValidDrawioEvent = (typeof VALID_DRAWIO_EVENTS)[number];

// Message structure validation
interface DrawioMessage {
  event: ValidDrawioEvent;
  data?: string;
  xml?: string;
  // Add other expected properties as needed
}

/**
 * Validates if the message origin is from a trusted drawio source
 */
export const isValidOrigin = (origin: string): boolean => ALLOWED_ORIGINS.includes(origin);

/**
 * Validates if the message has a valid drawio event type
 */
export const isValidDrawioEvent = (event: string): event is ValidDrawioEvent =>
  VALID_DRAWIO_EVENTS.includes(event as ValidDrawioEvent);

/**
 * Validates if the message structure is valid
 */
export const isValidMessageStructure = (msg: unknown): msg is DrawioMessage => {
  if (!msg || typeof msg !== "object") {
    return false;
  }

  const message = msg as Record<string, unknown>;

  if (!message.event || typeof message.event !== "string") {
    return false;
  }

  if (!isValidDrawioEvent(message.event)) {
    return false;
  }

  // Additional validation based on event type
  switch (message.event) {
    case "export":
      // Export events should have data and xml
      return typeof message.data === "string" && typeof message.xml === "string";
    case "init":
    case "save":
    case "exit":
      // These events don't require additional data validation
      return true;
    default:
      return true;
  }
};

/**
 * Comprehensive message validation for drawio iframe communication
 */
export const validateDrawioMessage = (
  event: MessageEvent,
  expectedOrigins?: string[]
): { isValid: boolean; message?: DrawioMessage; error?: string } => {
  // Check if event data exists
  if (!event.data || event.data.length === 0) {
    return { isValid: false, error: "Empty message data" };
  }

  // Validate origin
  const allowedOrigins = expectedOrigins || ALLOWED_ORIGINS;
  if (!allowedOrigins.includes(event.origin)) {
    console.warn(`[Drawio Security] Rejected message from invalid origin: ${event.origin}`);
    return { isValid: false, error: "Invalid origin" };
  }

  let msg: unknown;
  try {
    msg = JSON.parse(event.data as string);
  } catch (error) {
    console.warn("[Drawio Security] Failed to parse message data:", error);
    return { isValid: false, error: "Invalid JSON format" };
  }

  // Validate message structure
  if (!isValidMessageStructure(msg)) {
    console.warn("[Drawio Security] Invalid message structure:", msg);
    return { isValid: false, error: "Invalid message structure" };
  }

  return { isValid: true, message: msg };
};

/**
 * Creates a secure message sender for drawio iframe
 */
export const createSecureMessageSender = (iframeRef: React.RefObject<{ postMessage: (message: string) => void }>) => ({
  sendToDrawio: (action: string, data?: Record<string, unknown>) => {
    const message = {
      action,
      ...data,
      // Add a timestamp for additional verification if needed
      timestamp: Date.now(),
    };

    iframeRef.current?.postMessage(JSON.stringify(message));
  },
});
