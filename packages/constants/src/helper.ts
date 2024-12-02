// Utility function to merge enums
export const mergeEnums = <T, U>(enum1: T, enum2: U): T & U => {
  return { ...enum1, ...enum2 };
};
