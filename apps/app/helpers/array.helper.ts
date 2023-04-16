export const groupBy = (array: any[], key: string) => {
  const innerKey = key.split("."); // split the key by dot
  return array.reduce((result, currentValue) => {
    const key = innerKey.reduce((obj, i) => obj?.[i], currentValue) ?? "None"; // get the value of the inner key
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};

export const orderArrayBy = (
  array: any[],
  key: string,
  ordering: "ascending" | "descending" = "ascending"
) => {
  if (key[0] === "-") {
    ordering = "descending";
    key = key.slice(1);
  }

  const innerKey = key.split("."); // split the key by dot

  return array.sort((a, b) => {
    const keyA = innerKey.reduce((obj, i) => obj[i], a); // get the value of the inner key
    const keyB = innerKey.reduce((obj, i) => obj[i], b); // get the value of the inner key
    if (keyA < keyB) {
      return ordering === "ascending" ? -1 : 1;
    }
    if (keyA > keyB) {
      return ordering === "ascending" ? 1 : -1;
    }
    return 0;
  });
};
