type TArgs = {
  acceptedMimeTypes: string[];
  file: File;
  maxFileSize: number;
};

export const isFileValid = (args: TArgs): boolean => {
  const { acceptedMimeTypes, file, maxFileSize } = args;

  if (!file) {
    alert("No file selected. Please select a file to upload.");
    return false;
  }

  if (!acceptedMimeTypes.includes(file.type)) {
    alert("Invalid file type. Please select a JPEG, JPG, PNG, WEBP or GIF file.");
    return false;
  }

  if (file.size > maxFileSize) {
    alert(`File size too large. Please select a file smaller than ${maxFileSize / 1024 / 1024}MB.`);
    return false;
  }

  return true;
};
