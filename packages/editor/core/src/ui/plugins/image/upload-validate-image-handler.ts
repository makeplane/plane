import { type UploadImage } from "src/types/upload-image";

export async function uploadAndValidateImage(file: File, uploadFile: UploadImage): Promise<string | undefined> {
  try {
    const imageUrl = await uploadFile(file);

    if (imageUrl == null) {
      throw new Error("Image URL is undefined.");
    }

    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        resolve();
      };
      image.onerror = (error) => {
        console.error("Error in loading image: ", error);
        reject(error);
      };
    });

    return imageUrl;
  } catch (error) {
    console.error("Error in uploading image: ", error);
    // throw error to remove the placeholder
    throw error;
  }
}
