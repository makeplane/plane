export function isFileValid(file: File): boolean {
  if (!file) {
    alert("No file selected. Please select a file to upload.");
    return false;
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    alert("Invalid file type. Please select a JPEG, JPG, PNG, or WEBP image file.");
    return false;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File size too large. Please select a file smaller than 5MB.");
    return false;
  }

  return true;
}
