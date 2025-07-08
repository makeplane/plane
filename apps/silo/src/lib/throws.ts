import "reflect-metadata";

export function throws(errors: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const stack = new Error().stack;
      const callerLine = stack?.split("\n")[2];
      // console.log(stack)

      // if (!callerLine?.includes("try")) {
      //   console.warn(
      //     `Warning: ${propertyKey} should be called within a try-catch block. Possible errors: ${errors.join(", ")}`
      //   )
      // }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
