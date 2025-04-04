import { handleError } from "../../lib/error-handling/error-factory";

/**
 * A simple validation utility that integrates with our error system.
 *
 * This provides a fluent interface for validating data and throwing
 * appropriate errors if validation fails.
 */
export class Validator<T> {
  constructor(
    private readonly data: T,
    private readonly name: string = "data"
  ) {}

  /**
   * Ensures a value is defined (not undefined or null)
   */
  required(message?: string): Validator<T> {
    if (this.data === undefined || this.data === null) {
      throw handleError(new ValidationError(this.name, message || `${this.name} is required`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateRequired",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures a value is a string
   */
  string(message?: string): Validator<T> {
    if (typeof this.data !== "string") {
      throw handleError(new ValidationError(this.name, message || `${this.name} must be a string`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateString",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures a string is not empty
   */
  notEmpty(message?: string): Validator<T> {
    if (typeof this.data === "string" && this.data.trim() === "") {
      throw handleError(new ValidationError(this.name, message || `${this.name} cannot be empty`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateNonEmptyString",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures a value is a number
   */
  number(message?: string): Validator<T> {
    if (typeof this.data !== "number" || isNaN(this.data)) {
      throw handleError(new ValidationError(this.name, message || `${this.name} must be a valid number`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateNumber",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures an array is not empty
   */
  nonEmptyArray(message?: string): Validator<T> {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      throw handleError(new ValidationError(this.name, message || `${this.name} must be a non-empty array`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateArray",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures a value matches a regular expression
   */
  match(regex: RegExp, message?: string): Validator<T> {
    if (typeof this.data !== "string" || !regex.test(this.data)) {
      throw handleError(new ValidationError(this.name, message || `${this.name} has an invalid format`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateFormat",
        extraContext: { field: this.name, format: regex.toString() },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Ensures a value is one of the allowed values
   */
  oneOf(allowedValues: any[], message?: string): Validator<T> {
    if (!allowedValues.includes(this.data)) {
      throw handleError(
        new ValidationError(this.name, message || `${this.name} must be one of: ${allowedValues.join(", ")}`),
        {
          errorType: "bad-request",
          component: "validation",
          operation: "validateEnum",
          extraContext: { field: this.name, allowedValues },
          throw: true,
        }
      );
    }
    return this;
  }

  /**
   * Custom validation function
   */
  custom(validationFn: (value: T) => boolean, message?: string): Validator<T> {
    if (!validationFn(this.data)) {
      throw handleError(new ValidationError(this.name, message || `${this.name} is invalid`), {
        errorType: "bad-request",
        component: "validation",
        operation: "validateCustom",
        extraContext: { field: this.name },
        throw: true,
      });
    }
    return this;
  }

  /**
   * Get the validated data
   */
  get(): T {
    return this.data;
  }
}

/**
 * Create a new validator for a value
 */
export const validate = <T>(data: T, name?: string): Validator<T> => {
  return new Validator(data, name);
};

export default validate;

export class ValidationError extends Error {
  constructor(
    public name: string,
    message: string
  ) {
    super(message);
    this.name = name;
  }
}

export const validateRequired = (value: any, name: string, message?: string) => {
  if (value === undefined || value === null) {
    throw handleError(new ValidationError(name, message || `${name} is required`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateRequired",
      extraContext: { field: name },
      throw: true,
    });
  }
};

export const validateString = (value: any, name: string, message?: string) => {
  if (typeof value !== "string") {
    throw handleError(new ValidationError(name, message || `${name} must be a string`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateString",
      extraContext: { field: name },
      throw: true,
    });
  }
};

export const validateNonEmptyString = (value: string, name: string, message?: string) => {
  if (!value.trim()) {
    throw handleError(new ValidationError(name, message || `${name} cannot be empty`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateNonEmptyString",
      extraContext: { field: name },
      throw: true,
    });
  }
};

export const validateNumber = (value: any, name: string, message?: string) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw handleError(new ValidationError(name, message || `${name} must be a valid number`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateNumber",
      extraContext: { field: name },
      throw: true,
    });
  }
};

export const validateArray = (value: any, name: string, message?: string) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw handleError(new ValidationError(name, message || `${name} must be a non-empty array`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateArray",
      extraContext: { field: name },
      throw: true,
    });
  }
};

export const validateFormat = (value: string, name: string, format: RegExp, message?: string) => {
  if (!format.test(value)) {
    throw handleError(new ValidationError(name, message || `${name} has an invalid format`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateFormat",
      extraContext: { field: name, format: format.toString() },
      throw: true,
    });
  }
};

export const validateEnum = (value: any, name: string, allowedValues: any[], message?: string) => {
  if (!allowedValues.includes(value)) {
    throw handleError(new ValidationError(name, message || `${name} must be one of: ${allowedValues.join(", ")}`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateEnum",
      extraContext: { field: name, allowedValues },
      throw: true,
    });
  }
};

export const validateCustom = (value: any, name: string, validator: (value: any) => boolean, message?: string) => {
  if (!validator(value)) {
    throw handleError(new ValidationError(name, message || `${name} is invalid`), {
      errorType: "bad-request",
      component: "validation",
      operation: "validateCustom",
      extraContext: { field: name },
      throw: true,
    });
  }
};
