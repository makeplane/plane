import "reflect-metadata";
import { asyncHandler } from "@/core/helpers/error-handling/error-handler";

/**
 * Decorator to wrap controller methods with error handling
 * This automatically catches and processes all errors using our error handling system
 */
export const CatchErrors = (): MethodDecorator => {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    // Only apply to methods that are not WebSocket handlers
    const isWebSocketHandler = Reflect.getMetadata("method", target, propertyKey) === "ws";

    if (typeof originalMethod === "function" && !isWebSocketHandler) {
      descriptor.value = asyncHandler(originalMethod);
    }

    return descriptor;
  };
};

