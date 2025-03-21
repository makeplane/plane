import { IControllerRegistry, ControllerRegistration, WebSocketControllerRegistration } from "@/lib/controller.interface";
import { createControllerRegistry } from "@/lib/controller.utils";

// Import controllers
import { HealthController } from "@/controllers/health.controller";
import { DocumentController } from "@/controllers/document.controller";
import { CollaborationController } from "@/controllers/collaboration.controller";

/**
 * Controller Registry Module
 * Centralized place to register all controllers and their dependencies
 */
class ControllerRegistryModule {
  // Define controller groups for better organization using registration format
  private readonly CONTROLLERS = {
    // Core system controllers (health checks, status endpoints)
    CORE: [
      { Controller: HealthController }
    ],
    
    // Document management controllers
    DOCUMENT: [
      { Controller: DocumentController }
    ],
    
    // WebSocket controllers for real-time functionality
    WEBSOCKET: [
      { Controller: CollaborationController, dependencies: ['hocuspocus'] }
    ],
  };
  
  /**
   * Get all REST controllers
   */
  getAllRestControllers(): ControllerRegistration[] {
    return [...this.CONTROLLERS.CORE, ...this.CONTROLLERS.DOCUMENT];
  }
  
  /**
   * Get all WebSocket controllers
   */
  getAllWebSocketControllers(): WebSocketControllerRegistration[] {
    return this.CONTROLLERS.WEBSOCKET;
  }
  
  /**
   * Create a controller registry with all configured controllers
   */
  createRegistry(): IControllerRegistry {
    return createControllerRegistry(
      this.getAllRestControllers(),
      this.getAllWebSocketControllers()
    );
  }
}

// Export a singleton instance
export const controllerRegistry = new ControllerRegistryModule(); 