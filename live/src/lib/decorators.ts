import "reflect-metadata";
import type { RequestHandler } from "express";
import { asyncHandler } from "@/core/helpers/error-handling/error-handler";

// Re-export all decorators from our new package
export {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Middleware,
  WebSocket
} from "@plane/decorators";

/**
 * Decorator to wrap controller methods with error handling
 * This automatically catches and processes all errors using our error handling system
 */
export const CatchErrors = (): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Only apply to methods that are not WebSocket handlers
    const isWebSocketHandler = Reflect.getMetadata("method", target, propertyKey) === "ws";
    
    if (typeof originalMethod === 'function' && !isWebSocketHandler) {
      descriptor.value = asyncHandler(originalMethod);
    }
    
    return descriptor;
  };
};