export const getFileExtension = (filename: string) => filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

export const getFileName = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");

  const nameWithoutExtension = fileName.substring(0, dotIndex);

  return nameWithoutExtension;
};

export const convertBytesToSize = (bytes: number) => {
  let size;

  if (bytes < 1024 * 1024) {
    size = Math.round(bytes / 1024) + " KB";
  } else {
    size = Math.round(bytes / (1024 * 1024)) + " MB";
  }

  return size;
};
