import { Router } from "express";
import { IControllerRegistry, IServiceContainer, ControllerRegistration, WebSocketControllerRegistration } from "./controller.interface";
import "reflect-metadata";

// Define valid HTTP methods
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'all' | 'use' | 'options' | 'head' | 'ws';

/**
 * Register all controllers from a registry with dependency injection
 * @param router Express router to register routes on
 * @param registry Controller registry containing all controllers
 * @param container Service container for dependency injection
 */
export function registerControllers(
  router: Router, 
  registry: IControllerRegistry,
  container: IServiceContainer
): void {
  // Register REST controllers
  registry.controllers.forEach((registration) => {
    const { Controller, dependencies = [] } = registration;
    const resolvedDependencies = dependencies.map(dep => container.get(dep));
    const instance = new Controller(...resolvedDependencies);
    instance.registerRoutes(router);
  });

  // Register WebSocket controllers
  registry.webSocketControllers.forEach((registration) => {
    const { Controller, dependencies = [] } = registration;
    const resolvedDependencies = dependencies.map(dep => container.get(dep));
    const instance = new Controller(...resolvedDependencies);
    
    // Call the specialized WebSocket registration method
    instance.registerWebSocketRoutes(router);
  });
}

/**
 * Create a controller registry with the given controllers
 * @param controllers Array of REST controller registrations
 * @param webSocketControllers Array of WebSocket controller registrations
 * @returns Controller registry
 */
export function createControllerRegistry(
  controllers: ControllerRegistration[],
  webSocketControllers: WebSocketControllerRegistration[] = []
): IControllerRegistry {
  return {
    controllers,
    webSocketControllers,
  };
} 