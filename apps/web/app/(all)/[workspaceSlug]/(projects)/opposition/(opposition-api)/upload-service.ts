const BASE_URL = process.env.NEXT_PUBLIC_CP_SERVER_URL;

// 1. Helper to generate a consistent file name
 export const generateFileOppositionName = (name: string, id: string, file: File) => {
  const cleanName = name.replace(/\s+/g, '').toLowerCase();
  const extension = file.type.split('/')[1]; // e.g., 'png'
  return `${cleanName}_${id}.${extension}`;
};

// 2. The Upload Logic (replaces your Angular uploadImage)
export const uploadImageToServer = async (file: File, path: string, name: string) => {
  const url = `${BASE_URL}/blob?path=${path}&name=${name}&replace=1`;
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }
  return res.json(); // Or handle based on your specific API response
};

// 3. Helper to get full URL for display
export const getAbsoluteImageUrl = (partialPath: string) => {
  if (!partialPath) return null;
  if (partialPath.startsWith("data:") || partialPath.startsWith("http")) return partialPath; // Handle existing Base64 or full URLs
  return `${BASE_URL}/blobs/${partialPath}`;
};