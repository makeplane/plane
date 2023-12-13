export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const isNil = (value: any) => {
  if (value === undefined || value === null) return true;

  return false;
};
