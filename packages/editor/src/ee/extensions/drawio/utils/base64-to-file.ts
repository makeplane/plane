export const base64ToFile = (base64Data: string, filename: string, mimeType: string): File => {
  // Remove data URL prefix if present
  let base64: string;
  if (base64Data.includes(",")) {
    const parts = base64Data.split(",");
    if (parts.length < 2) {
      throw new Error("Invalid base64 data URL format. Expected format: 'data:[mediatype];base64,[data]'");
    }
    base64 = parts[1];
  } else {
    base64 = base64Data;
  }

  // Convert base64 to binary
  let binaryString: string;
  try {
    binaryString = atob(base64);
  } catch (error) {
    throw new Error(
      `Failed to decode base64 data: ${error instanceof Error ? error.message : "Invalid base64 characters"}`
    );
  }

  // Create byte array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create and return File object
  return new File([bytes], filename, { type: mimeType });
};
