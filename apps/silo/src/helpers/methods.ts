import { Promise } from "bluebird";

/**
 * Process a batch of items in parallel
 * @param items - The items to process
 * @param processFn - The function to process each item
 * @param concurrency - The number of items to process in parallel
 * @returns The results of the processed items
 */
export const processBatchPromises = async <T, R>(
  items: T[],
  processFn: (item: T) => Promise<R | null>,
  concurrency: number = 5
): Promise<R[]> => {
  const results = await Promise.map(items, async (item: T) => processFn(item), { concurrency });

  return results.filter((result): result is R => result !== null);
};
