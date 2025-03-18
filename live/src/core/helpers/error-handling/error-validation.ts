import Errors from "./error-factory";

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
      throw Errors.badRequest(message || `${this.name} is required`);
    }
    return this;
  }

  /**
   * Ensures a value is a string
   */
  string(message?: string): Validator<T> {
    if (typeof this.data !== "string") {
      throw Errors.badRequest(message || `${this.name} must be a string`);
    }
    return this;
  }

  /**
   * Ensures a string is not empty
   */
  notEmpty(message?: string): Validator<T> {
    if (typeof this.data === "string" && this.data.trim() === "") {
      throw Errors.badRequest(message || `${this.name} cannot be empty`);
    }
    return this;
  }

  /**
   * Ensures a value is a number
   */
  number(message?: string): Validator<T> {
    if (typeof this.data !== "number" || isNaN(this.data)) {
      throw Errors.badRequest(message || `${this.name} must be a valid number`);
    }
    return this;
  }

  /**
   * Ensures an array is not empty
   */
  nonEmptyArray(message?: string): Validator<T> {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      throw Errors.badRequest(message || `${this.name} must be a non-empty array`);
    }
    return this;
  }

  /**
   * Ensures a value matches a regular expression
   */
  match(regex: RegExp, message?: string): Validator<T> {
    if (typeof this.data !== "string" || !regex.test(this.data)) {
      throw Errors.badRequest(message || `${this.name} has an invalid format`);
    }
    return this;
  }

  /**
   * Ensures a value is one of the allowed values
   */
  oneOf(allowedValues: any[], message?: string): Validator<T> {
    if (!allowedValues.includes(this.data)) {
      throw Errors.badRequest(message || `${this.name} must be one of: ${allowedValues.join(", ")}`);
    }
    return this;
  }

  /**
   * Custom validation function
   */
  custom(validationFn: (value: T) => boolean, message?: string): Validator<T> {
    if (!validationFn(this.data)) {
      throw Errors.badRequest(message || `${this.name} is invalid`);
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
