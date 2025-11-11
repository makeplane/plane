function removeDuplicates<T>(array: T[], by = JSON.stringify): T[] {
  const seen: Record<string, boolean> = {};
  return array.filter((item) => {
    const key = by(item);
    return Object.prototype.hasOwnProperty.call(seen, key) ? false : (seen[key] = true);
  });
}

export function findDuplicates(items: string[]): string[] {
  const filtered = items.filter((el, index) => items.indexOf(el) !== index);
  const duplicates = removeDuplicates(filtered);
  return duplicates;
}
