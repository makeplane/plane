import { CONTROLLERS } from "@/plane-live/controllers";

// Helper to get all REST controllers
export const getAllControllers: any = () => [...CONTROLLERS.CORE, ...CONTROLLERS.DOCUMENT, ...CONTROLLERS.WEBSOCKET];
