/**
 * A type representing either a success (right) or failure (left) value
 */
export type Either<L, R> =
  | { success: true, data: R }
  | { success: false, error: L };

/**
 * Creates a Right (success) Either value
 */
export function right<L, R>(value: R): Either<L, R> {
  return { success: true, data: value };
}

/**
 * Creates a Left (error) Either value
 */
export function left<L, R>(error: L): Either<L, R> {
  return { success: false, error };
}
