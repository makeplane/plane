import { HealthController } from "@/controllers/health.controller";
import { DocumentController } from "@/controllers/document.controller";
import { CollaborationController } from "@/controllers/collaboration.controller";

/**
 * Controller registry exports
 * Simple grouped arrays of controller classes for better organization
 */
export const CONTROLLERS = {
  // Core system controllers (health checks, status endpoints)
  CORE: [HealthController],

  // Document management controllers
  DOCUMENT: [DocumentController],

  // WebSocket controllers for real-time functionality
  WEBSOCKET: [CollaborationController],
};

// Helper to get all REST controllers
export const getAllControllers = () => [...CONTROLLERS.CORE, ...CONTROLLERS.DOCUMENT, ...CONTROLLERS.WEBSOCKET];
