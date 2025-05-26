// Export all controllers from this barrel file
import { CollaborationController } from "./collaboration.controller";
import { LiveDocumentController } from "./live-document.controller";
import { DocumentController } from "./document.controller";
import { HealthController } from "./health.controller";

export const CONTROLLERS = {
  // Core system controllers (health checks, status endpoints)
  CORE: [HealthController],

  // Document management controllers
  DOCUMENT: [DocumentController, LiveDocumentController],

  // WebSocket controllers for real-time functionality
  WEBSOCKET: [CollaborationController],
};
