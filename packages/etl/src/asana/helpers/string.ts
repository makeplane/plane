export const removeArrayObjSpaces = (arr: any[]) => {
  const results = arr.map((obj) => removeSpacesFromKeys(obj));
  return results;
};

export const removeSpacesFromKeys = (obj: any) => {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = key.replace(/\s+/g, "_").toLowerCase();
    // @ts-ignore
    newObj[newKey] = value;
  }
  return newObj;
};

export const formatDateStringForHHMM = (inputDate: Date): string => {
  const date = new Date(inputDate);
  // Extract date components
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
  const day = date.getDate().toString().padStart(2, "0");

  // Construct the formatted date string
  const formattedDate = `${year}/${month}/${day}`;

  return formattedDate;
};

// TODO: bring with function to utils package to better use in other packages
export const getRandomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);
