export const stripTrailingSlash = (url: string): string => url.replace(/\/$/, "");

export const removeArrayObjSpaces = (arr: any[]) => {
  const results = arr.map((obj) => removeSpacesFromKeys(obj));
  return results;
};

export const removeSpacesFromKeys = (obj: any) => {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = key.replace(/\s+/g, "_").toLowerCase();
    // @ts-expect-error
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

export const getRandomColor = () => "#" + Math.floor(Math.random() * 16777215).toString(16);

export const getFormattedDate = (date: string | null | undefined): string | undefined => {
  if (date) {
    const dateObj = new Date(date);

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dateObj.getUTCDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
};

export const getFormattedDateFromTimestamp = (timestamp: number | undefined): string | undefined => {
  if (timestamp) {
    const dateObj = new Date(timestamp);

    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(dateObj.getUTCDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  }
};

export const convertAppSlugToIntegrationKey = (slug: string): string => {
  // Convert "github" to "GITHUB"
  // Convert "prd-agent" to "PRD_AGENT"
  const normalizedSlug = slug.toUpperCase().replace(/-/g, "_");
  return normalizedSlug;
};
