import { handleError } from "./error-factory";

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
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} is required`,
        component: 'validator',
        operation: 'required',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures a value is a string
   */
  string(message?: string): Validator<T> {
    if (typeof this.data !== "string") {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} must be a string`,
        component: 'validator',
        operation: 'string',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures a string is not empty
   */
  notEmpty(message?: string): Validator<T> {
    if (typeof this.data === "string" && this.data.trim() === "") {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} cannot be empty`,
        component: 'validator',
        operation: 'notEmpty',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures a value is a number
   */
  number(message?: string): Validator<T> {
    if (typeof this.data !== "number" || isNaN(this.data)) {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} must be a valid number`,
        component: 'validator',
        operation: 'number',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures an array is not empty
   */
  nonEmptyArray(message?: string): Validator<T> {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} must be a non-empty array`,
        component: 'validator',
        operation: 'nonEmptyArray',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures a value matches a regular expression
   */
  match(regex: RegExp, message?: string): Validator<T> {
    if (typeof this.data !== "string" || !regex.test(this.data)) {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} has an invalid format`,
        component: 'validator',
        operation: 'match',
        throw: true
      });
    }
    return this;
  }

  /**
   * Ensures a value is one of the allowed values
   */
  oneOf(allowedValues: any[], message?: string): Validator<T> {
    if (!allowedValues.includes(this.data)) {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} must be one of: ${allowedValues.join(", ")}`,
        component: 'validator',
        operation: 'oneOf',
        throw: true
      });
    }
    return this;
  }

  /**
   * Custom validation function
   */
  custom(validationFn: (value: T) => boolean, message?: string): Validator<T> {
    if (!validationFn(this.data)) {
      throw handleError(null, {
        errorType: 'bad-request',
        message: message || `${this.name} is invalid`,
        component: 'validator',
        operation: 'custom',
        throw: true
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
