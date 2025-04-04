import { HealthController } from "./health.controller";
import { DocumentController } from "./document.controller";
import { CollaborationController } from "./collaboration.controller";

export const REST_CONTROLLERS = [HealthController, DocumentController];

export const WEBSOCKET_CONTROLLERS = [CollaborationController];
