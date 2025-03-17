import { IServiceContainer } from "./controller.interface";

/**
 * Simple service container implementation for dependency injection
 */
export class ServiceContainer implements IServiceContainer {
  private services: Map<string, any> = new Map();

  /**
   * Register a service in the container
   * @param serviceName Name of the service
   * @param service The service instance
   */
  register(serviceName: string, service: any): void {
    this.services.set(serviceName, service);
  }

  /**
   * Get a service from the container
   * @param serviceName Name of the service
   * @returns The service instance
   * @throws Error if service not found
   */
  get(serviceName: string): any {
    if (!this.services.has(serviceName)) {
      throw new Error(`Service ${serviceName} not found in container`);
    }
    return this.services.get(serviceName);
  }
} 